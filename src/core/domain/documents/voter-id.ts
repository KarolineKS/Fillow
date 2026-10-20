import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import type { StateUf } from "../shared/state-uf";
import { applyMask, extractDigits, randomDigits, wrongCheckDigit } from "./document-parsing";
import { ABROAD_VOTER_CODE, VOTER_UF_CODES } from "./regional-data";

/** Título de Eleitor: 8 sequential digits, 2 UF code digits, 2 check digits. */
export interface VoterId {
  readonly digits: string;
  readonly formatted: string;
}

const ZERO_BECOMES_ONE = new Set([VOTER_UF_CODES.SP, VOTER_UF_CODES.MG]);
const KNOWN_CODES = new Set([...Object.values(VOTER_UF_CODES), ABROAD_VOTER_CODE]);

function settle(remainder: number, ufCode: string): number {
  if (remainder === 0 && ZERO_BECOMES_ONE.has(ufCode)) {
    return 1;
  }
  return remainder === 10 ? 0 : remainder;
}

function checkDigits(sequential: string, ufCode: string): string {
  let sum = 0;
  for (let index = 0; index < 8; index += 1) {
    sum += Number(sequential[index]) * (index + 2);
  }
  const first = settle(sum % 11, ufCode);
  const second = settle(
    (Number(ufCode[0]) * 7 + Number(ufCode[1]) * 8 + first * 9) % 11,
    ufCode,
  );
  return `${first}${second}`;
}

function fromDigits(digits: string): VoterId {
  return { digits, formatted: applyMask(digits, "0000 0000 0000") };
}

export const VoterId = {
  parse(raw: string): Result<VoterId, DomainError> {
    return Result.flatMap(
      extractDigits(raw, { label: "Voter ID", allowed: /^[\d \-/.]*$/, length: 12 }),
      (digits) => {
        const ufCode = digits.slice(8, 10);
        if (!KNOWN_CODES.has(ufCode)) {
          return Result.err(DomainError.invalidStateUf(`Voter ID UF code ${ufCode} does not exist`));
        }
        return checkDigits(digits.slice(0, 8), ufCode) === digits.slice(10)
          ? Result.ok(fromDigits(digits))
          : Result.err(wrongCheckDigit("Voter ID"));
      },
    );
  },

  generate(random: RandomSource, stateUf: StateUf): VoterId {
    const sequential = randomDigits(random, 8);
    const ufCode = VOTER_UF_CODES[stateUf];
    return fromDigits(sequential + ufCode + checkDigits(sequential, ufCode));
  },

  checkDigits,
} as const;
