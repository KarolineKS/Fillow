import { Cep } from "../documents/cep";
import { Cnh } from "../documents/cnh";
import { Cnpj } from "../documents/cnpj";
import { Cpf } from "../documents/cpf";
import { CreditCard } from "../documents/credit-card";
import { randomDigits } from "../documents/document-parsing";
import { Pis } from "../documents/pis";
import { Rg } from "../documents/rg";
import { VoterId } from "../documents/voter-id";
import { BirthDate } from "../persona/birth-date";
import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import type { SemanticFieldType } from "../shared/semantic-field-type";
import { BRAZILIAN_STATES } from "../shared/state-uf";
import type { TestPayload } from "./test-payload";

export interface InvalidPayloadOptions {
  /** "YYYY-MM-DD" the date payloads are relative to. */
  readonly referenceDate: string;
  /** `underage` asks `birthDate` for a 17-year-old instead of a future date. */
  readonly variant?: "underage";
}

type Builder = (random: RandomSource, reference: BirthDate, options: InvalidPayloadOptions) => Omit<TestPayload, "kind" | "fieldType">;

/** The correct check digit is unique, so any other last digit is wrong. */
function breakLastDigit(value: string): string {
  const last = value.slice(-1);
  const replacement = last === "X" ? "0" : String((Number(last) + 1) % 10);
  return value.slice(0, -1) + replacement;
}

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function letter(random: RandomSource): string {
  return LETTERS[random.nextInt(0, 25)] ?? "A";
}

const MALFORMED_EMAILS = ["ana.souza.example.com", "ana@@example.com", "ana@example", "ana souza@example.com"] as const;

const BUILDERS: Partial<Record<SemanticFieldType, Builder>> = {
  cpf: (random) => ({
    value: breakLastDigit(Cpf.generate(random).digits),
    reasonCode: "CPF_BAD_CHECK_DIGIT",
    explanation: "A CPF with 11 digits but a wrong check digit. The form should reject it, because the Receita Federal never issues such a number.",
  }),
  cnpj: (random) => ({
    value: breakLastDigit(Cnpj.generate(random).digits),
    reasonCode: "CNPJ_BAD_CHECK_DIGIT",
    explanation: "A CNPJ with 14 digits but a wrong check digit. Accepting it lets a mistyped company id reach your database.",
  }),
  rg: (random) => ({
    value: breakLastDigit(Rg.generate(random).value),
    reasonCode: "RG_BAD_CHECK_DIGIT",
    explanation: "An RG in the São Paulo layout whose last character does not match its check digit.",
  }),
  pis: (random) => ({
    value: breakLastDigit(Pis.generate(random).digits),
    reasonCode: "PIS_BAD_CHECK_DIGIT",
    explanation: "A PIS/PASEP with 11 digits but a wrong check digit. Payroll and benefit systems reject it later, so the form should catch it now.",
  }),
  cnh: (random) => ({
    value: breakLastDigit(Cnh.generate(random).digits),
    reasonCode: "CNH_BAD_CHECK_DIGIT",
    explanation: "A driver's license number (CNH) with a wrong second check digit.",
  }),
  voterId: (random) => ({
    value: breakLastDigit(VoterId.generate(random, random.pick(BRAZILIAN_STATES)).digits),
    reasonCode: "VOTER_ID_BAD_CHECK_DIGIT",
    explanation: "A Voter ID (Título de Eleitor) with a valid state code but a wrong check digit.",
  }),
  creditCard: (random) => ({
    value: breakLastDigit(CreditCard.generate(random).digits),
    reasonCode: "CREDIT_CARD_BAD_LUHN",
    explanation: "A card number with a real brand prefix that fails the Luhn checksum. Checking it locally saves a round trip to the payment gateway.",
  }),
  email: (random) => ({
    value: random.pick(MALFORMED_EMAILS),
    reasonCode: "EMAIL_MALFORMED",
    explanation: "An email without exactly one @ or without a dotted domain. A confirmation email sent to it can never arrive.",
  }),
  cep: (random) => ({
    value: Cep.generate(random, random.pick(BRAZILIAN_STATES)).digits.slice(0, 7),
    reasonCode: "CEP_TOO_SHORT",
    explanation: "A CEP with 7 digits instead of 8. Address lookups fail silently when the length is not enforced.",
  }),
  phone: (random) => ({
    value: `209${randomDigits(random, 8)}`,
    reasonCode: "PHONE_UNKNOWN_AREA_CODE",
    explanation: "A phone number with area code 20, which does not exist in Brazil.",
  }),
  birthDate: (random, reference, options) =>
    options.variant === "underage"
      ? {
          value: BirthDate.forAge(random, 17, reference).iso,
          reasonCode: "BIRTH_DATE_UNDERAGE",
          explanation: "A birth date that makes the person 17. Forms restricted to adults must refuse it.",
        }
      : {
          value: BirthDate.after(random, reference).iso,
          reasonCode: "BIRTH_DATE_IN_FUTURE",
          explanation: "A birth date after today. Nobody can be born in the future, so the form should block it.",
        },
  ctps: (random) => ({
    value: randomDigits(random, 6),
    reasonCode: "CTPS_NUMBER_TOO_SHORT",
    explanation: "A work card (CTPS) number with 6 digits instead of 7.",
  }),
  licensePlate: (random) => ({
    value: `${letter(random)}${letter(random)}${random.nextInt(0, 9)}${random.nextInt(0, 9)}${letter(random)}${random.nextInt(0, 9)}${random.nextInt(0, 9)}`,
    reasonCode: "LICENSE_PLATE_MALFORMED",
    explanation: "A plate that matches neither the Mercosul layout (ABC1D23) nor the old one (ABC1234).",
  }),
  number: (random) => ({
    value: `${random.nextInt(1, 9)}O${random.nextInt(0, 9)}`,
    reasonCode: "NUMBER_HAS_LETTERS",
    explanation: "A number with the letter O typed instead of zero. Numeric fields should refuse letters instead of saving NaN.",
  }),
  money: (random) => ({
    value: `${random.nextInt(1, 9)}.5OO,00`,
    reasonCode: "MONEY_HAS_LETTERS",
    explanation: "An amount with letters O instead of zeros. Money fields that accept it break totals and invoices.",
  }),
};

export function invalidPayload(
  fieldType: SemanticFieldType,
  options: InvalidPayloadOptions,
  random: RandomSource,
): Result<TestPayload, DomainError> {
  const builder = BUILDERS[fieldType];
  if (builder === undefined) {
    return Result.err(DomainError.generationFailed(`Field type "${fieldType}" has no invalid form`));
  }
  return Result.map(BirthDate.parse(options.referenceDate), (reference) => ({
    kind: "invalid" as const,
    fieldType,
    ...builder(random, reference, options),
  }));
}
