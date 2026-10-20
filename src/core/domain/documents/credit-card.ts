import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { extractDigits, randomDigits, wrongCheckDigit } from "./document-parsing";

export type CardBrand = "visa" | "mastercard" | "amex";

export interface CreditCard {
  readonly digits: string;
  readonly brand: CardBrand;
}

const BRANDS: readonly { brand: CardBrand; prefixes: readonly string[]; length: number }[] = [
  { brand: "visa", prefixes: ["4"], length: 16 },
  { brand: "mastercard", prefixes: ["51", "52", "53", "54", "55"], length: 16 },
  { brand: "amex", prefixes: ["34", "37"], length: 15 },
];

function luhnSum(digits: string, doubleFromRight: 0 | 1): number {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    let digit = Number(digits[digits.length - 1 - index]);
    if (index % 2 === doubleFromRight) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
  }
  return sum;
}

export function passesLuhn(digits: string): boolean {
  return digits.length > 0 && luhnSum(digits, 1) % 10 === 0;
}

function luhnCheckDigit(partial: string): string {
  return String((10 - (luhnSum(partial, 0) % 10)) % 10);
}

function brandOf(digits: string): CardBrand | undefined {
  return BRANDS.find(
    (entry) => entry.length === digits.length && entry.prefixes.some((prefix) => digits.startsWith(prefix)),
  )?.brand;
}

export const CreditCard = {
  parse(raw: string): Result<CreditCard, DomainError> {
    const length = raw.replace(/[ \-]/g, "").length === 15 ? 15 : 16;
    return Result.flatMap(
      extractDigits(raw, { label: "Credit card", allowed: /^[\d \-]*$/, length }),
      (digits) => {
        const brand = brandOf(digits);
        if (brand === undefined) {
          return Result.err(DomainError.invalidFormat("Card prefix is not Visa, Mastercard or Amex"));
        }
        return passesLuhn(digits) ? Result.ok({ digits, brand }) : Result.err(wrongCheckDigit("Credit card"));
      },
    );
  },

  generate(random: RandomSource): CreditCard {
    const spec = random.pick(BRANDS);
    const prefix = random.pick(spec.prefixes);
    const partial = prefix + randomDigits(random, spec.length - prefix.length - 1);
    return { digits: partial + luhnCheckDigit(partial), brand: spec.brand };
  },
} as const;
