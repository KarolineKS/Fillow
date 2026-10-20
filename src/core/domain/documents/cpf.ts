import type { DomainError } from "../shared/domain-error";
import { mod11CheckDigit, toDigitArray } from "../shared/digit-utils";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { applyMask, avoidRepeated, extractDigits, randomDigits, wrongCheckDigit } from "./document-parsing";

export interface Cpf {
  readonly digits: string;
  readonly formatted: string;
}

const FIRST_WEIGHTS = [10, 9, 8, 7, 6, 5, 4, 3, 2] as const;
const SECOND_WEIGHTS = [11, 10, 9, 8, 7, 6, 5, 4, 3, 2] as const;

function checkDigits(base: string): string {
  const first = mod11CheckDigit(toDigitArray(base), FIRST_WEIGHTS);
  const second = mod11CheckDigit(toDigitArray(base + String(first)), SECOND_WEIGHTS);
  return `${first}${second}`;
}

function fromDigits(digits: string): Cpf {
  return { digits, formatted: applyMask(digits, "000.000.000-00") };
}

export const Cpf = {
  parse(raw: string): Result<Cpf, DomainError> {
    return Result.flatMap(
      extractDigits(raw, { label: "CPF", allowed: /^[\d.\-]*$/, length: 11, rejectRepeated: true }),
      (digits) =>
        checkDigits(digits.slice(0, 9)) === digits.slice(9)
          ? Result.ok(fromDigits(digits))
          : Result.err(wrongCheckDigit("CPF")),
    );
  },

  generate(random: RandomSource): Cpf {
    const base = avoidRepeated(randomDigits(random, 9));
    return fromDigits(base + checkDigits(base));
  },

  checkDigits,
} as const;
