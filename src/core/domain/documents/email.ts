import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";

export interface Email {
  readonly value: string;
}

const EMAIL_SHAPE = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

export const Email = {
  parse(raw: string): Result<Email, DomainError> {
    return EMAIL_SHAPE.test(raw)
      ? Result.ok({ value: raw })
      : Result.err(
          DomainError.invalidFormat("Email needs exactly one @ and a dotted domain"),
        );
  },
} as const;
