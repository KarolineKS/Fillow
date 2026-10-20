import { describe, expect, it } from "vitest";
import { Cnh } from "../documents/cnh";
import { Cnpj } from "../documents/cnpj";
import { Cpf } from "../documents/cpf";
import { Email } from "../documents/email";
import { Pis } from "../documents/pis";
import { Rg } from "../documents/rg";
import { VoterId } from "../documents/voter-id";
import { DeterministicGeneratorService } from "../persona/deterministic-generator-service";
import type { DomainError } from "../shared/domain-error";
import type { Result } from "../shared/result";
import { SeededRandom } from "../shared/seeded-random";
import type { SemanticFieldType } from "../shared/semantic-field-type";
import type { TestPayload } from "./test-payload";

const REFERENCE = "2026-10-19";
const SEEDS = Array.from({ length: 200 }, (_, index) => index + 1);

function payload(fieldType: SemanticFieldType, seed: number, variant?: "underage"): TestPayload {
  const result = DeterministicGeneratorService.invalidPayload(
    fieldType,
    variant === undefined ? { referenceDate: REFERENCE } : { referenceDate: REFERENCE, variant },
    new SeededRandom(seed),
  );
  if (!result.ok) {
    throw new Error(`expected ok for ${fieldType}, got ${result.error.code}`);
  }
  return result.value;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  [...digits].reverse().forEach((character, index) => {
    let digit = Number(character);
    if (index % 2 === 1) {
      digit = digit * 2 > 9 ? digit * 2 - 9 : digit * 2;
    }
    sum += digit;
  });
  return sum % 10 === 0;
}

function ageAtReference(iso: string): number {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const passed = month < 10 || (month === 10 && day <= 19);
  return 2026 - year - (passed ? 0 : 1);
}

const CHECK_DIGIT_TYPES: readonly [SemanticFieldType, number, (raw: string) => Result<unknown, DomainError>][] = [
  ["cpf", 11, Cpf.parse],
  ["cnpj", 14, Cnpj.parse],
  ["rg", 9, Rg.parse],
  ["pis", 11, Pis.parse],
  ["cnh", 11, Cnh.parse],
  ["voterId", 12, VoterId.parse],
];

const SUPPORTED: readonly SemanticFieldType[] = [
  "cpf", "cnpj", "rg", "pis", "cnh", "voterId", "creditCard", "email", "cep", "phone",
  "birthDate", "ctps", "licensePlate", "number", "money",
];

describe("invalid payloads", () => {
  it("check digit payloads are rejected by their value object", () => {
    for (const [fieldType, length, parse] of CHECK_DIGIT_TYPES) {
      for (const seed of SEEDS) {
        const value = payload(fieldType, seed);
        expect(value.kind).toBe("invalid");
        expect(value.value, fieldType).toHaveLength(length);
        const parsed = parse(value.value);
        expect(parsed.ok ? undefined : parsed.error.code, `${fieldType} ${value.value}`).toBe("INVALID_CHECK_DIGIT");
      }
    }
    for (const seed of SEEDS) {
      const card = payload("creditCard", seed).value;
      expect(card).toMatch(/^(4\d{15}|5[1-5]\d{14}|3[47]\d{13})$/);
      expect(luhnValid(card), card).toBe(false);
    }
  });

  it("format payloads per field type", () => {
    for (const seed of SEEDS) {
      expect(Email.parse(payload("email", seed).value).ok).toBe(false);
      expect(payload("cep", seed).value).toMatch(/^\d{7}$/);
      expect(payload("phone", seed).value.startsWith("20")).toBe(true);
      expect(payload("birthDate", seed).value > REFERENCE).toBe(true);
      expect(payload("birthDate", seed).value).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(payload("ctps", seed).value).toMatch(/^\d{6}$/);
      expect(payload("licensePlate", seed).value).not.toMatch(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/);
      expect(payload("number", seed).value).toMatch(/[A-Za-z]/);
      expect(payload("money", seed).value).toMatch(/[A-Za-z]/);
    }
  });

  it("underage birth date is 17", () => {
    for (const seed of SEEDS) {
      expect(ageAtReference(payload("birthDate", seed, "underage").value)).toBe(17);
    }
  });

  it("every payload has reason and explanation", () => {
    for (const fieldType of SUPPORTED) {
      for (const seed of [1, 2, 3]) {
        const value = payload(fieldType, seed);
        expect(value.fieldType).toBe(fieldType);
        expect(value.reasonCode).toMatch(/^[A-Z0-9_]+$/);
        expect(value.explanation.trim().length).toBeGreaterThan(0);
      }
    }
    const underage = payload("birthDate", 1, "underage");
    expect(underage.reasonCode).toMatch(/^[A-Z0-9_]+$/);
    expect(underage.explanation.trim().length).toBeGreaterThan(0);
  });

  it("types without invalid form fail", () => {
    for (const fieldType of ["fullName", "text"] as const) {
      const result = DeterministicGeneratorService.invalidPayload(
        fieldType,
        { referenceDate: REFERENCE },
        new SeededRandom(1),
      );
      expect(result.ok ? undefined : result.error.code).toBe("GENERATION_FAILED");
    }
  });
});
