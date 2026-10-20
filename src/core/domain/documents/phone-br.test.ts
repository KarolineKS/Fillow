import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { BRAZILIAN_STATES } from "../shared/state-uf";
import { PhoneBr } from "./phone-br";

// Anatel DDDs, written independently of the production table.
const DDDS: Record<string, readonly number[]> = {
  AC: [68], AL: [82], AP: [96], AM: [92, 97], BA: [71, 73, 74, 75, 77], CE: [85, 88],
  DF: [61], ES: [27, 28], GO: [62, 64], MA: [98, 99], MT: [65, 66], MS: [67],
  MG: [31, 32, 33, 34, 35, 37, 38], PA: [91, 93, 94], PB: [83], PR: [41, 42, 43, 44, 45, 46],
  PE: [81, 87], PI: [86, 89], RJ: [21, 22, 24], RN: [84], RS: [51, 53, 54, 55], RO: [69],
  RR: [95], SC: [47, 48, 49], SP: [11, 12, 13, 14, 15, 16, 17, 18, 19], SE: [79], TO: [63],
};

describe("PhoneBr", () => {
  it("generated ddd belongs to the uf", () => {
    expect(Object.keys(DDDS)).toHaveLength(27);
    for (const uf of BRAZILIAN_STATES) {
      for (let seed = 1; seed <= 30; seed += 1) {
        const random = new SeededRandom(seed);
        for (const phone of [PhoneBr.generateMobile(random, uf), PhoneBr.generateLandline(random, uf)]) {
          expect(DDDS[uf], `${uf} ${phone.digits}`).toContain(Number(phone.digits.slice(0, 2)));
        }
      }
    }
  });

  it("mobile and landline shapes", () => {
    for (let seed = 1; seed <= 1000; seed += 1) {
      const random = new SeededRandom(seed);
      const uf = random.pick(BRAZILIAN_STATES);
      expect(PhoneBr.generateMobile(random, uf).digits).toMatch(/^\d{2}9\d{8}$/);
      expect(PhoneBr.generateLandline(random, uf).digits).toMatch(/^\d{2}[2-5]\d{7}$/);
    }
  });
});
