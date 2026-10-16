export function onlyDigits(raw: string): string {
  return raw.replace(/\D+/g, "");
}

export function toDigitArray(digits: string): number[] {
  return digits.split("").map((character) => Number(character));
}

export function isAllDigits(value: string): boolean {
  return value.length > 0 && /^\d+$/.test(value);
}

export function allSameDigit(digits: string): boolean {
  return digits.length > 0 && /^(\d)\1*$/.test(digits);
}

/**
 * Brazilian "modulo 11" check digit: remainders below 2 collapse to 0,
 * which is the convention shared by CPF, CNPJ, PIS and similar documents.
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
