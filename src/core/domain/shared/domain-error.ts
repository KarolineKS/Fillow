/**
 * Structured, serializable domain errors.
 *
 * Every failure carries a stable machine-readable `code`, a human-readable
 * English `message`, and an optional plain-language `explanation` suitable
 * for display in the junior-friendly QA UI.
 */

export type DomainErrorCode =
  | "INVALID_FORMAT"
  | "INVALID_CHECK_DIGIT"
  | "INVALID_LENGTH"
  | "OUT_OF_RANGE"
  | "INVALID_STATE_UF"
  | "GENERATION_FAILED"
  | "UNSUPPORTED_PATTERN";

export interface DomainError {
  readonly code: DomainErrorCode;
  readonly message: string;
  readonly explanation?: string;
}

export const DomainError = {
  create(
    code: DomainErrorCode,
    message: string,
    explanation?: string,
  ): DomainError {
    return explanation === undefined
      ? { code, message }
      : { code, message, explanation };
  },

  invalidFormat(message: string, explanation?: string): DomainError {
    return DomainError.create("INVALID_FORMAT", message, explanation);
  },

  invalidCheckDigit(message: string, explanation?: string): DomainError {
    return DomainError.create("INVALID_CHECK_DIGIT", message, explanation);
  },

  invalidLength(message: string, explanation?: string): DomainError {
    return DomainError.create("INVALID_LENGTH", message, explanation);
  },

  outOfRange(message: string, explanation?: string): DomainError {
    return DomainError.create("OUT_OF_RANGE", message, explanation);
  },

  invalidStateUf(message: string, explanation?: string): DomainError {
    return DomainError.create("INVALID_STATE_UF", message, explanation);
  },

  generationFailed(message: string, explanation?: string): DomainError {
    return DomainError.create("GENERATION_FAILED", message, explanation);
  },

  unsupportedPattern(message: string, explanation?: string): DomainError {
    return DomainError.create("UNSUPPORTED_PATTERN", message, explanation);
  },
} as const;
