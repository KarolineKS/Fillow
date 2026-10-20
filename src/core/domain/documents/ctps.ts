import { DomainError } from "../shared/domain-error";
import { isAllDigits } from "../shared/digit-utils";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { isStateUf, type StateUf } from "../shared/state-uf";
import { randomDigits } from "./document-parsing";

/** Carteira de Trabalho: no public check digit exists, so validity is format only. */
export interface Ctps {
  readonly number: string;
  readonly series: string;
  readonly stateUf: StateUf;
}

export interface CtpsInput {
  readonly number: string;
  readonly series: string;
  readonly stateUf: string;
}

export const Ctps = {
  parse(input: CtpsInput): Result<Ctps, DomainError> {
    if (!isAllDigits(input.number) || !isAllDigits(input.series)) {
      return Result.err(DomainError.invalidFormat("CTPS number and series must be digits"));
    }
    if (input.number.length !== 7) {
      return Result.err(DomainError.invalidLength(`CTPS number must have 7 digits, got ${input.number.length}`));
    }
    if (input.series.length !== 4) {
      return Result.err(DomainError.invalidLength(`CTPS series must have 4 digits, got ${input.series.length}`));
    }
    if (!isStateUf(input.stateUf)) {
      return Result.err(DomainError.invalidStateUf(`CTPS UF ${input.stateUf} does not exist`));
    }
    return Result.ok({ number: input.number, series: input.series, stateUf: input.stateUf });
  },

  generate(random: RandomSource, stateUf: StateUf): Ctps {
    return { number: randomDigits(random, 7), series: randomDigits(random, 4), stateUf };
  },
} as const;
