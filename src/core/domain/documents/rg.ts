import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { randomDigits, wrongCheckDigit } from "./document-parsing";

/** RG in the São Paulo layout (8 digits + check digit, `X` for 10), the only public RG algorithm. */
export interface Rg {
  readonly value: string;
  readonly formatted: string;
}

function checkDigit(base: string): string {
  let sum = 0;
  for (let index = 0; index < 8; index += 1) {
    sum += Number(base[index]) * (index + 2);
  }
  const digit = 11 - (sum % 11);
  if (digit === 10) {
    return "X";
  }
  return digit === 11 ? "0" : String(digit);
}

function fromValue(value: string): Rg {
  return { value, formatted: `${value.slice(0, 2)}.${value.slice(2, 5)}.${value.slice(5, 8)}-${value.slice(8)}` };
}

export const Rg = {
  parse(raw: string): Result<Rg, DomainError> {
    if (!/^[\dXx.\- ]*$/.test(raw) || /[Xx](?=.*[\dXx])/.test(raw)) {
      return Result.err(DomainError.invalidFormat("RG contains characters other than digits, X and its mask"));
    }
    const value = raw.replace(/[.\- ]/g, "").toUpperCase();
    if (value.length !== 9) {
      return Result.err(DomainError.invalidLength(`RG must have 9 characters, got ${value.length}`));
    }
    return checkDigit(value.slice(0, 8)) === value.slice(8)
      ? Result.ok(fromValue(value))
      : Result.err(wrongCheckDigit("RG"));
  },

  generate(random: RandomSource): Rg {
    const base = randomDigits(random, 8);
    return fromValue(base + checkDigit(base));
  },

  checkDigit,
} as const;
