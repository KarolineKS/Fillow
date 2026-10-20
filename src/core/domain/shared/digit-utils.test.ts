import { describe, expect, it } from "vitest";
import { allSameDigit, isAllDigits, mod11CheckDigit, onlyDigits, toDigitArray } from "./digit-utils";

describe("digit utils", () => {
  it("mod11 check digit", () => {
    const cpfFirstWeights = [10, 9, 8, 7, 6, 5, 4, 3, 2];
    expect(mod11CheckDigit([5, 2, 9, 9, 8, 2, 2, 4, 7], cpfFirstWeights)).toBe(2);
    // sum 11 -> remainder 0 -> 0
    expect(mod11CheckDigit([1, 1], [10, 1])).toBe(0);
    // sum 12 -> remainder 1 -> 0
    expect(mod11CheckDigit([1, 1], [10, 2])).toBe(0);
    // sum 13 -> remainder 2 -> 9
    expect(mod11CheckDigit([1, 1], [10, 3])).toBe(9);
  });

  it("digit helpers", () => {
    expect(onlyDigits("529.982.247-25")).toBe("52998224725");
    expect(toDigitArray("507")).toEqual([5, 0, 7]);
    expect(isAllDigits("123")).toBe(true);
    expect(isAllDigits("")).toBe(false);
    expect(isAllDigits("12a")).toBe(false);
    expect(allSameDigit("1111")).toBe(true);
    expect(allSameDigit("1112")).toBe(false);
    expect(allSameDigit("")).toBe(false);
  });
});
