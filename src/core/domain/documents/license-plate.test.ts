import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { LicensePlate } from "./license-plate";

describe("LicensePlate", () => {
  it("mercosul plate shape", () => {
    for (let seed = 1; seed <= 1000; seed += 1) {
      expect(LicensePlate.generate(new SeededRandom(seed))).toMatch(/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/);
    }
  });
});
