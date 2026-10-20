import type { DomainError } from "../shared/domain-error";
import { allSameDigit, mod11CheckDigit, toDigitArray } from "../shared/digit-utils";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { applyMask, extractDigits, randomDigits, wrongCheckDigit } from "./document-parsing";

export interface Cnpj {
  readonly digits: string;
  readonly formatted: string;
}

const FIRST_WEIGHTS = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const SECOND_WEIGHTS = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const HEADQUARTERS_BRANCH = "0001";

function checkDigits(base: string): string {
  const first = mod11CheckDigit(toDigitArray(base), FIRST_WEIGHTS);
  const second = mod11CheckDigit(toDigitArray(base + String(first)), SECOND_WEIGHTS);
  return `${first}${second}`;
}

function fromDigits(digits: string): Cnpj {
  return { digits, formatted: applyMask(digits, "00.000.000/0000-00") };
}

export const Cnpj = {
  parse(raw: string): Result<Cnpj, DomainError> {
    return Result.flatMap(
      extractDigits(raw, { label: "CNPJ", allowed: /^[\d.\-/]*$/, length: 14, rejectRepeated: true }),
      (digits) =>
        checkDigits(digits.slice(0, 12)) === digits.slice(12)
          ? Result.ok(fromDigits(digits))
          : Result.err(wrongCheckDigit("CNPJ")),
    );
  },

  generate(random: RandomSource): Cnpj {
    let root = randomDigits(random, 8);
    while (allSameDigit(root)) {
      root = randomDigits(random, 8);
    }
    const base = root + HEADQUARTERS_BRANCH;
    return fromDigits(base + checkDigits(base));
  },

  checkDigits,
} as const;
