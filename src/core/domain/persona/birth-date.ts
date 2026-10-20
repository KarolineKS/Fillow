import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";

/** Calendar date without time zone, compared as plain year/month/day. */
export interface BirthDate {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly iso: string;
}

function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function fromParts(year: number, month: number, day: number): BirthDate {
  const iso = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  return { year, month, day, iso };
}

export const BirthDate = {
  parse(iso: string): Result<BirthDate, DomainError> {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    if (match === null) {
      return Result.err(DomainError.invalidFormat(`Date must be YYYY-MM-DD, got "${iso}"`));
    }
    const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) {
      return Result.err(DomainError.invalidFormat(`${iso} is not a calendar date`));
    }
    return Result.ok(fromParts(year, month, day));
  },

  ageAt(birth: BirthDate, reference: BirthDate): number {
    const birthdayPassed =
      reference.month > birth.month || (reference.month === birth.month && reference.day >= birth.day);
    return reference.year - birth.year - (birthdayPassed ? 0 : 1);
  },

  /** A birth date that makes the person exactly `age` years old on `reference`. */
  forAge(random: RandomSource, age: number, reference: BirthDate): BirthDate {
    const month = random.nextInt(1, 12);
    const day = random.nextInt(1, 28);
    const birthdayPassed = reference.month > month || (reference.month === month && reference.day >= day);
    return fromParts(reference.year - age - (birthdayPassed ? 0 : 1), month, day);
  },

  /** A date strictly after `reference`, between 1 and 365 days later. */
  after(random: RandomSource, reference: BirthDate): BirthDate {
    const shifted = new Date(Date.UTC(reference.year, reference.month - 1, reference.day + random.nextInt(1, 365)));
    return fromParts(shifted.getUTCFullYear(), shifted.getUTCMonth() + 1, shifted.getUTCDate());
  },
} as const;
