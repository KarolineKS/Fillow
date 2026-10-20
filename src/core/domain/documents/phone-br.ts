import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import type { StateUf } from "../shared/state-uf";
import { applyMask, randomDigits } from "./document-parsing";
import { AREA_CODES } from "./regional-data";
import { onlyDigits } from "../shared/digit-utils";

export interface PhoneBr {
  readonly digits: string;
  readonly formatted: string;
  readonly kind: "mobile" | "landline";
}

const KNOWN_AREA_CODES = new Set(Object.values(AREA_CODES).flat());

function fromDigits(digits: string): PhoneBr {
  return digits.length === 11
    ? { digits, formatted: applyMask(digits, "(00) 00000-0000"), kind: "mobile" }
    : { digits, formatted: applyMask(digits, "(00) 0000-0000"), kind: "landline" };
}

export const PhoneBr = {
  parse(raw: string): Result<PhoneBr, DomainError> {
    if (!/^[\d()\- ]*$/.test(raw)) {
      return Result.err(DomainError.invalidFormat("Phone contains characters other than digits and its mask"));
    }
    const digits = onlyDigits(raw);
    if (digits.length !== 10 && digits.length !== 11) {
      return Result.err(DomainError.invalidLength(`Phone must have 10 or 11 digits, got ${digits.length}`));
    }
    if (!KNOWN_AREA_CODES.has(Number(digits.slice(0, 2)))) {
      return Result.err(DomainError.invalidFormat(`Area code ${digits.slice(0, 2)} does not exist`));
    }
    const third = digits[2];
    const shapeOk = digits.length === 11 ? third === "9" : third !== undefined && "2345".includes(third);
    return shapeOk
      ? Result.ok(fromDigits(digits))
      : Result.err(DomainError.invalidFormat("Mobile numbers start with 9, landlines with 2 to 5"));
  },

  generateMobile(random: RandomSource, stateUf: StateUf): PhoneBr {
    const areaCode = String(random.pick(AREA_CODES[stateUf]));
    return fromDigits(`${areaCode}9${randomDigits(random, 8)}`);
  },

  generateLandline(random: RandomSource, stateUf: StateUf): PhoneBr {
    const areaCode = String(random.pick(AREA_CODES[stateUf]));
    return fromDigits(`${areaCode}${random.nextInt(2, 5)}${randomDigits(random, 7)}`);
  },
} as const;
