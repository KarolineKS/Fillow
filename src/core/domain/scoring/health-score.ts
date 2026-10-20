import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";

export interface HealthScore {
  readonly value: number;
}

export const HealthScore = {
  create(value: number): Result<HealthScore, DomainError> {
    return Number.isInteger(value) && value >= 0 && value <= 100
      ? Result.ok({ value })
      : Result.err(DomainError.outOfRange(`Health score must be an integer from 0 to 100, got ${value}`));
  },
} as const;
