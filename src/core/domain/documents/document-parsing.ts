import { DomainError } from "../shared/domain-error";
import { allSameDigit, onlyDigits } from "../shared/digit-utils";
import { Result } from "../shared/result";

export interface DigitSpec {
  readonly label: string;
  /** Matches the whole raw input when it only holds digits and this document's mask punctuation. */
  readonly allowed: RegExp;
  readonly length: number;
  readonly rejectRepeated?: boolean;
}

export function extractDigits(raw: string, spec: DigitSpec): Result<string, DomainError> {
  if (!spec.allowed.test(raw)) {
    return Result.err(
      DomainError.invalidFormat(`${spec.label} contains characters other than digits and its mask`),
    );
  }
  const digits = onlyDigits(raw);
  if (digits.length !== spec.length) {
    return Result.err(
      DomainError.invalidLength(`${spec.label} must have ${spec.length} digits, got ${digits.length}`),
    );
  }
  if (spec.rejectRepeated === true && allSameDigit(digits)) {
    return Result.err(
      DomainError.invalidCheckDigit(`${spec.label} with a single repeated digit is never issued`),
    );
  }
  return Result.ok(digits);
}

export function wrongCheckDigit(label: string): DomainError {
  return DomainError.invalidCheckDigit(`${label} check digit does not match`);
}

export function randomDigits(random: { nextInt(min: number, max: number): number }, count: number): string {
  let digits = "";
  for (let index = 0; index < count; index += 1) {
    digits += String(random.nextInt(0, 9));
  }
  return digits;
}

export function applyMask(digits: string, mask: string): string {
  let cursor = 0;
  let output = "";
  for (const character of mask) {
    if (character === "0") {
      output += digits[cursor] ?? "";
      cursor += 1;
    } else {
      output += character;
    }
  }
  return output;
}
