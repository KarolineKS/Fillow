import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { BRAZILIAN_STATES } from "../shared/state-uf";
import { Cep } from "./cep";

// Correios ranges, written independently of the production table.
const RANGES: Record<string, string> = {
  SP: "01000-19999", RJ: "20000-28999", ES: "29000-29999", MG: "30000-39999",
  BA: "40000-48999", SE: "49000-49999", PE: "50000-56999", AL: "57000-57999",
  PB: "58000-58999", RN: "59000-59999", CE: "60000-63999", PI: "64000-64999",
  MA: "65000-65999", PA: "66000-68899", AP: "68900-68999", AM: "69000-69299,69400-69899",
  RR: "69300-69399", AC: "69900-69999", DF: "70000-72799,73000-73699",
  GO: "72800-72999,73700-76799", RO: "76800-76999", TO: "77000-77999",
  MT: "78000-78899", MS: "79000-79999", PR: "80000-87999", SC: "88000-89999",
  RS: "90000-99999",
};

function insideUf(cepDigits: string, uf: string): boolean {
  const prefix = Number(cepDigits.slice(0, 5));
  return (RANGES[uf] ?? "").split(",").some((range) => {
    const [low, high] = range.split("-").map(Number);
    return low !== undefined && high !== undefined && prefix >= low && prefix <= high;
  });
}

describe("Cep", () => {
  it("generated cep is inside the uf range", () => {
    expect(Object.keys(RANGES)).toHaveLength(27);
    for (const uf of BRAZILIAN_STATES) {
      for (let seed = 1; seed <= 50; seed += 1) {
        const cep = Cep.generate(new SeededRandom(seed), uf);
        expect(cep.digits).toMatch(/^\d{8}$/);
        expect(insideUf(cep.digits, uf), `${uf} ${cep.digits}`).toBe(true);
      }
    }
  });
});
