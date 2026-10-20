import type { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import type { StateUf } from "../shared/state-uf";
import { applyMask, extractDigits } from "./document-parsing";
import { CEP_RANGES } from "./regional-data";

export interface Cep {
  readonly digits: string;
  readonly formatted: string;
}

function fromDigits(digits: string): Cep {
  return { digits, formatted: applyMask(digits, "00000-000") };
}

export const Cep = {
  parse(raw: string): Result<Cep, DomainError> {
    return Result.map(
      extractDigits(raw, { label: "CEP", allowed: /^[\d.\-]*$/, length: 8 }),
      fromDigits,
    );
  },

  /** Inside the UF's Correios range; not guaranteed to exist in the Correios address database. */
  generate(random: RandomSource, stateUf: StateUf): Cep {
    const [low, high] = random.pick(CEP_RANGES[stateUf]);
    return fromDigits(String(random.nextInt(low, high)).padStart(8, "0"));
  },
} as const;
