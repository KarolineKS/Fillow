import { describe, expect, it } from "vitest";
import { DeterministicGeneratorService } from "../persona/deterministic-generator-service";
import { SeededRandom } from "../shared/seeded-random";
import type { SemanticFieldType } from "../shared/semantic-field-type";

// Door 2: reasonCode is the stable key the UI localizes, so each value is part of the contract.
const EXPECTED: readonly [SemanticFieldType, string, "underage"?][] = [
  ["cpf", "CPF_BAD_CHECK_DIGIT"],
  ["cnpj", "CNPJ_BAD_CHECK_DIGIT"],
  ["rg", "RG_BAD_CHECK_DIGIT"],
  ["pis", "PIS_BAD_CHECK_DIGIT"],
  ["cnh", "CNH_BAD_CHECK_DIGIT"],
  ["voterId", "VOTER_ID_BAD_CHECK_DIGIT"],
  ["creditCard", "CREDIT_CARD_BAD_LUHN"],
  ["email", "EMAIL_MALFORMED"],
  ["cep", "CEP_TOO_SHORT"],
  ["phone", "PHONE_UNKNOWN_AREA_CODE"],
  ["birthDate", "BIRTH_DATE_IN_FUTURE"],
  ["birthDate", "BIRTH_DATE_UNDERAGE", "underage"],
  ["ctps", "CTPS_NUMBER_TOO_SHORT"],
  ["licensePlate", "LICENSE_PLATE_MALFORMED"],
  ["number", "NUMBER_HAS_LETTERS"],
  ["money", "MONEY_HAS_LETTERS"],
];

describe("invalid payload reason codes", () => {
  it("each field type emits its pinned reason code", () => {
    for (const [fieldType, reasonCode, variant] of EXPECTED) {
      const result = DeterministicGeneratorService.invalidPayload(
        fieldType,
        variant === undefined ? { referenceDate: "2026-10-19" } : { referenceDate: "2026-10-19", variant },
        new SeededRandom(1),
      );
      expect(result.ok ? result.value.reasonCode : result.error.code, fieldType).toBe(reasonCode);
    }
  });
});
