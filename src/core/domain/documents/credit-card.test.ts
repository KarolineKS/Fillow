import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { CreditCard, passesLuhn } from "./credit-card";

const BRAND_SHAPES: Record<string, RegExp> = {
  visa: /^4\d{15}$/,
  mastercard: /^5[1-5]\d{14}$/,
  amex: /^3[47]\d{13}$/,
};

describe("CreditCard", () => {
  it("brands prefixes lengths and luhn", () => {
    expect(passesLuhn("4111111111111111")).toBe(true);
    expect(passesLuhn("5555555555554444")).toBe(true);
    expect(passesLuhn("378282246310005")).toBe(true);
    expect(passesLuhn("4111111111111112")).toBe(false);

    const seen = new Set<string>();
    for (let seed = 1; seed <= 1000; seed += 1) {
      const card = CreditCard.generate(new SeededRandom(seed));
      const shape = BRAND_SHAPES[card.brand];
      expect(shape, card.brand).toBeDefined();
      expect(card.digits).toMatch(shape as RegExp);
      expect(passesLuhn(card.digits), card.digits).toBe(true);
      seen.add(card.brand);
    }
    expect([...seen].sort()).toEqual(["amex", "mastercard", "visa"]);
  });
});
