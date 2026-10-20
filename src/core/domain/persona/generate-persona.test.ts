import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { BRAZILIAN_STATES } from "../shared/state-uf";
import { DeterministicGeneratorService } from "./deterministic-generator-service";
import type { Persona, PersonaRequest } from "./persona";

// Provided by the Node runtime; the core tsconfig deliberately ships no DOM or Node types.
declare const structuredClone: <T>(value: T) => T;

const REFERENCE = "2026-10-19";
const SEEDS = Array.from({ length: 200 }, (_, index) => index + 1);

const CEP_RANGES: Record<string, string> = {
  SP: "01000-19999", RJ: "20000-28999", ES: "29000-29999", MG: "30000-39999", BA: "40000-48999",
  SE: "49000-49999", PE: "50000-56999", AL: "57000-57999", PB: "58000-58999", RN: "59000-59999",
  CE: "60000-63999", PI: "64000-64999", MA: "65000-65999", PA: "66000-68899", AP: "68900-68999",
  AM: "69000-69299,69400-69899", RR: "69300-69399", AC: "69900-69999", DF: "70000-72799,73000-73699",
  GO: "72800-72999,73700-76799", RO: "76800-76999", TO: "77000-77999", MT: "78000-78899",
  MS: "79000-79999", PR: "80000-87999", SC: "88000-89999", RS: "90000-99999",
};
const DDDS: Record<string, readonly number[]> = {
  AC: [68], AL: [82], AP: [96], AM: [92, 97], BA: [71, 73, 74, 75, 77], CE: [85, 88], DF: [61],
  ES: [27, 28], GO: [62, 64], MA: [98, 99], MT: [65, 66], MS: [67], MG: [31, 32, 33, 34, 35, 37, 38],
  PA: [91, 93, 94], PB: [83], PR: [41, 42, 43, 44, 45, 46], PE: [81, 87], PI: [86, 89],
  RJ: [21, 22, 24], RN: [84], RS: [51, 53, 54, 55], RO: [69], RR: [95], SC: [47, 48, 49],
  SP: [11, 12, 13, 14, 15, 16, 17, 18, 19], SE: [79], TO: [63],
};
const VOTER_CODES: Record<string, string> = {
  SP: "01", MG: "02", RJ: "03", RS: "04", BA: "05", PR: "06", CE: "07", PE: "08", SC: "09",
  GO: "10", MA: "11", PB: "12", PA: "13", ES: "14", PI: "15", RN: "16", AL: "17", MT: "18",
  MS: "19", DF: "20", SE: "21", AM: "22", RO: "23", AC: "24", AP: "25", RR: "26", TO: "27",
};

function generate(request: Partial<PersonaRequest>, seed: number) {
  return DeterministicGeneratorService.generatePersona(
    { referenceDate: REFERENCE, ...request },
    new SeededRandom(seed),
  );
}

function persona(request: Partial<PersonaRequest>, seed: number): Persona {
  const result = generate(request, seed);
  if (!result.ok) {
    throw new Error(`expected ok, got ${result.error.code}`);
  }
  return result.value;
}

function errorCode(request: Partial<PersonaRequest>): string | undefined {
  const result = generate(request, 1);
  return result.ok ? undefined : result.error.code;
}

// Age at 2026-10-19 computed from the ISO string alone.
function ageAtReference(birthDate: string): number {
  const [year, month, day] = birthDate.split("-").map(Number) as [number, number, number];
  const passed = month < 10 || (month === 10 && day <= 19);
  return 2026 - year - (passed ? 0 : 1);
}

function digits(value: string): string {
  return value.replace(/\D/g, "");
}

function cepInside(cep: string, uf: string): boolean {
  const prefix = Number(digits(cep).slice(0, 5));
  return (CEP_RANGES[uf] ?? "").split(",").some((range) => {
    const [low, high] = range.split("-").map(Number) as [number, number];
    return prefix >= low && prefix <= high;
  });
}

function expectRegionalAgreement(value: Persona, uf: string): void {
  expect(value.address.stateUf).toBe(uf);
  expect(cepInside(value.address.cep, uf), `${uf} cep ${value.address.cep}`).toBe(true);
  expect(DDDS[uf]).toContain(Number(digits(value.phones.mobile).slice(0, 2)));
  expect(DDDS[uf]).toContain(Number(digits(value.phones.landline).slice(0, 2)));
  expect(digits(value.voterId).slice(8, 10)).toBe(VOTER_CODES[uf]);
  expect(value.ctps.stateUf).toBe(uf);
}

describe("generatePersona", () => {
  it("default persona is complete", () => {
    for (const seed of SEEDS) {
      const value = persona({}, seed);
      const flat = [
        value.fullName, value.email, value.birthDate, value.cpf, value.cnpj, value.rg, value.cnh,
        value.ctps.number, value.ctps.series, value.ctps.stateUf, value.pis, value.voterId,
        value.address.cep, value.address.street, value.address.number, value.address.neighborhood,
        value.address.city, value.address.stateUf, value.phones.mobile, value.phones.landline,
      ];
      for (const field of flat) {
        expect(typeof field).toBe("string");
        expect(field.length).toBeGreaterThan(0);
      }
      expect(value.age).toBeGreaterThanOrEqual(18);
      expect(value.age).toBeLessThanOrEqual(80);
      expect(ageAtReference(value.birthDate)).toBe(value.age);
    }
  });

  it("persona survives structured clone", () => {
    const value = persona({}, 3);
    expect(structuredClone(value)).toStrictEqual(value);
    expect(JSON.parse(JSON.stringify(value))).toStrictEqual(value);
  });

  it("age bounds are respected", () => {
    const sixty = persona({ minAge: 60, maxAge: 60 }, 5);
    expect(sixty.age).toBe(60);
    expect(ageAtReference(sixty.birthDate)).toBe(60);
    const newborn = persona({ minAge: 0, maxAge: 0 }, 5);
    expect(newborn.age).toBe(0);
    expect(ageAtReference(newborn.birthDate)).toBe(0);
    for (const seed of SEEDS) {
      const value = persona({ minAge: 30, maxAge: 40 }, seed);
      expect(value.age).toBeGreaterThanOrEqual(30);
      expect(value.age).toBeLessThanOrEqual(40);
      expect(ageAtReference(value.birthDate)).toBe(value.age);
    }
  });

  it("state uf drives every regional field", () => {
    for (const seed of SEEDS) {
      expectRegionalAgreement(persona({ stateUf: "SP" }, seed), "SP");
    }
    for (const uf of BRAZILIAN_STATES) {
      expectRegionalAgreement(persona({ stateUf: uf }, 11), uf);
    }
  });

  it("unknown uf is rejected", () => {
    expect(errorCode({ stateUf: "XX" })).toBe("INVALID_STATE_UF");
  });

  it("invalid age bounds are rejected", () => {
    expect(errorCode({ minAge: 50, maxAge: 40 })).toBe("OUT_OF_RANGE");
    expect(errorCode({ minAge: -1 })).toBe("OUT_OF_RANGE");
    expect(errorCode({ maxAge: 121 })).toBe("OUT_OF_RANGE");
  });

  it("formatted toggles masks", () => {
    for (const value of [persona({ formatted: true }, 9), persona({}, 9)]) {
      expect(value.cpf).toMatch(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/);
      expect(value.cnpj).toMatch(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/);
      expect(value.address.cep).toMatch(/^\d{5}-\d{3}$/);
      expect(value.phones.mobile).toMatch(/^\(\d{2}\) \d{5}-\d{4}$/);
    }
    const plain = persona({ formatted: false }, 9);
    expect(plain.cpf).toMatch(/^\d{11}$/);
    expect(plain.cnpj).toMatch(/^\d{14}$/);
    expect(plain.address.cep).toMatch(/^\d{8}$/);
    expect(plain.phones.mobile).toMatch(/^\d{11}$/);
  });

  it("email derives from name on reserved domain", () => {
    for (const seed of SEEDS) {
      const value = persona({}, seed);
      expect(value.email).toMatch(/^[a-z0-9.]+@example\.(com|net|org)$/);
      const firstName = (value.fullName.split(" ")[0] ?? "")
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase();
      expect(value.email.split("@")[0]).toContain(firstName);
    }
  });

  it("same seed same persona", () => {
    const request = { stateUf: "RS", minAge: 25, maxAge: 35 };
    expect(persona(request, 7)).toStrictEqual(persona(request, 7));
    expect(persona(request, 7).cpf).not.toBe(persona(request, 8).cpf);
  });
});
