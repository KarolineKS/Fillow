import type { DomainError } from "../shared/domain-error";
import { allSameDigit, toDigitArray } from "../shared/digit-utils";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { extractDigits, randomDigits, wrongCheckDigit } from "./document-parsing";

export interface Cnh {
  readonly digits: string;
  readonly formatted: string;
}

/**
 * DENATRAN rule as implemented by validations-br: when the first digit
 * overflows to 0, the second digit is shifted down by 2 (the "dsc" adjustment).
 * That shift can yield 10, which no CNH carries, so such bases are never issued.
 */
function checkDigits(base: string): string {
  const digits = toDigitArray(base);
  let descendingSum = 0;
  let ascendingSum = 0;
  digits.forEach((digit, index) => {
    descendingSum += digit * (9 - index);
    ascendingSum += digit * (1 + index);
  });

  let first = descendingSum % 11;
  let adjustment = 0;
  if (first >= 10) {
    first = 0;
    adjustment = 2;
  }

  let second = ascendingSum % 11;
  if (second >= 10) {
    second = 0;
  }
  second -= adjustment;
  if (second < 0) {
    second += 11;
  }
  return `${first}${second}`;
}

function fromDigits(digits: string): Cnh {
  return { digits, formatted: digits };
}

export const Cnh = {
  parse(raw: string): Result<Cnh, DomainError> {
    return Result.flatMap(
      extractDigits(raw, { label: "CNH", allowed: /^[\d ]*$/, length: 11, rejectRepeated: true }),
      (digits) =>
        checkDigits(digits.slice(0, 9)) === digits.slice(9)
          ? Result.ok(fromDigits(digits))
          : Result.err(wrongCheckDigit("CNH")),
    );
  },

  generate(random: RandomSource): Cnh {
    const drawn = randomDigits(random, 9);
    const lastDigit = Number(drawn.slice(-1));
    // The last base digit has weight 1 in the first sum, so at most one of ten
    // consecutive values overflows: the bounded walk always finds an issuable number.
    for (let step = 0; step < 10; step += 1) {
      const base = drawn.slice(0, -1) + String((lastDigit + step) % 10);
      const candidate = base + checkDigits(base);
      if (candidate.length === 11 && !allSameDigit(candidate)) {
        return fromDigits(candidate);
      }
    }
    throw new RangeError("unreachable: no issuable CNH among ten consecutive bases");
  },

  checkDigits,
} as const;
