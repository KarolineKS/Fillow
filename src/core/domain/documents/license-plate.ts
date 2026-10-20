import type { RandomSource } from "../shared/seeded-random";

export const MERCOSUL_PLATE_PATTERN = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const LicensePlate = {
  generate(random: RandomSource): string {
    const letter = (): string => LETTERS[random.nextInt(0, 25)] ?? "A";
    const digit = (): string => String(random.nextInt(0, 9));
    return `${letter()}${letter()}${letter()}${digit()}${letter()}${digit()}${digit()}`;
  },

  isValid(value: string): boolean {
    return MERCOSUL_PLATE_PATTERN.test(value);
  },
} as const;
