import type { DomainError } from "../shared/domain-error";
import { mod11CheckDigit, toDigitArray } from "../shared/digit-utils";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { applyMask, avoidRepeated, extractDigits, randomDigits, wrongCheckDigit } from "./document-parsing";

/** PIS/PASEP/NIS share one number space and one check digit. */
export interface Pis {
  readonly digits: string;
  readonly formatted: string;
}

const WEIGHTS = [3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;

function checkDigit(base: string): string {
  return String(mod11CheckDigit(toDigitArray(base), WEIGHTS));
}

function fromDigits(digits: string): Pis {
  return { digits, formatted: applyMask(digits, "000.00000.00-0") };
}

export const Pis = {
  parse(raw: string): Result<Pis, DomainError> {
    return Result.flatMap(
      extractDigits(raw, { label: "PIS", allowed: /^[\d.\-]*$/, length: 11, rejectRepeated: true }),
      (digits) =>
        checkDigit(digits.slice(0, 10)) === digits.slice(10)
          ? Result.ok(fromDigits(digits))
          : Result.err(wrongCheckDigit("PIS")),
    );
  },

  generate(random: RandomSource): Pis {
    const base = avoidRepeated(randomDigits(random, 10));
    return fromDigits(base + checkDigit(base));
  },

  checkDigit,
} as const;
