import { describe, expect, it } from "vitest";
import { SeededRandom } from "./seeded-random";

describe("SeededRandom", () => {
  it("seeded random is reproducible and guarded", () => {
    const first = new SeededRandom(42);
    const second = new SeededRandom(42);
    const firstValues = Array.from({ length: 5 }, () => first.next());
    const secondValues = Array.from({ length: 5 }, () => second.next());

    expect(firstValues).toEqual(secondValues);
    for (const value of firstValues) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }

    expect(new SeededRandom(42).nextInt(3, 3)).toBe(3);
    expect(() => new SeededRandom(42).nextInt(5, 4)).toThrow(RangeError);
    expect(() => new SeededRandom(42).pick([])).toThrow(RangeError);
    expect(new SeededRandom(42).pick(["only"])).toBe("only");
  });
});
