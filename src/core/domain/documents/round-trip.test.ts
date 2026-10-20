import { describe, expect, it } from "vitest";
import type { DomainError } from "../shared/domain-error";
import type { Result } from "../shared/result";
import { SeededRandom } from "../shared/seeded-random";
import { BRAZILIAN_STATES } from "../shared/state-uf";
import { Cnh } from "./cnh";
import { Cnpj } from "./cnpj";
import { Cpf } from "./cpf";
import { Ctps } from "./ctps";
import { Pis } from "./pis";
import { Rg } from "./rg";
import { VoterId } from "./voter-id";

const SEEDS = Array.from({ length: 1000 }, (_, index) => index + 1);

const EXPECTED_VOTER_CODES: Record<string, string> = {
  SP: "01", MG: "02", RJ: "03", RS: "04", BA: "05", PR: "06", CE: "07", PE: "08", SC: "09",
  GO: "10", MA: "11", PB: "12", PA: "13", ES: "14", PI: "15", RN: "16", AL: "17", MT: "18",
  MS: "19", DF: "20", SE: "21", AM: "22", RO: "23", AC: "24", AP: "25", RR: "26", TO: "27",
};

describe("document generation", () => {
  it("generated documents parse for 1000 seeds", () => {
    const generators: readonly [string, (random: SeededRandom) => Result<unknown, DomainError>][] = [
      ["Cpf", (random) => Cpf.parse(Cpf.generate(random).digits)],
      ["Cnpj", (random) => Cnpj.parse(Cnpj.generate(random).digits)],
      ["Rg", (random) => Rg.parse(Rg.generate(random).value)],
      ["Cnh", (random) => Cnh.parse(Cnh.generate(random).digits)],
      ["Pis", (random) => Pis.parse(Pis.generate(random).digits)],
      ["VoterId", (random) => VoterId.parse(VoterId.generate(random, random.pick(BRAZILIAN_STATES)).digits)],
    ];
    for (const [label, roundTrip] of generators) {
      for (const seed of SEEDS) {
        const result = roundTrip(new SeededRandom(seed));
        expect(result.ok, `${label} seed ${seed}: ${JSON.stringify(result)}`).toBe(true);
      }
    }
  });

  it("voter id and ctps follow the uf", () => {
    expect(BRAZILIAN_STATES).toHaveLength(27);
    for (const uf of BRAZILIAN_STATES) {
      const random = new SeededRandom(uf.charCodeAt(0) * 31 + uf.charCodeAt(1));
      expect(VoterId.generate(random, uf).digits.slice(8, 10), uf).toBe(EXPECTED_VOTER_CODES[uf]);
      expect(Ctps.generate(random, uf).stateUf).toBe(uf);
    }
  });
});
