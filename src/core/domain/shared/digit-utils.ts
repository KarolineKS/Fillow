/**
 * Pure numeric-string helpers shared by Brazilian document Value Objects.
 */

/** Remove every non-digit character (masks, spaces, punctuation). */
export function onlyDigits(raw: string): string {
  return raw.replace(/\D+/g, "");
}

/** Convert a digit string into an array of single-digit numbers. */
export function toDigitArray(digits: string): number[] {
  return digits.split("").map((character) => Number(character));
}

/** True when every character in the string is an ASCII digit. */
export function isAllDigits(value: string): boolean {
  return value.length > 0 && /^\d+$/.test(value);
}

/** True when every digit in the string is identical (e.g. "11111111111"). */
export function allSameDigit(digits: string): boolean {
  return digits.length > 0 && /^(\d)\1*$/.test(digits);
}

/**
 * Compute a check digit using the standard Brazilian "modulo 11" algorithm.
 * The result follows the common convention where remainders below 2 map to 0.
 */
export function mod11CheckDigit(
  digits: readonly number[],
  weights: readonly number[],
): number {
  let sum = 0;
  for (let index = 0; index < digits.length; index += 1) {
    sum += (digits[index] ?? 0) * (weights[index] ?? 0);
  }
  const remainder = sum % 11;
  return remainder < 2 ? 0 : 11 - remainder;
}
