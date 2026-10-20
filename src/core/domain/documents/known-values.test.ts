import { describe, expect, it } from "vitest";
import type { DomainError } from "../shared/domain-error";
import type { Result } from "../shared/result";
import { Cep } from "./cep";
import { Cnh } from "./cnh";
import { Cnpj } from "./cnpj";
import { Cpf } from "./cpf";
import { Pis } from "./pis";
import { Rg } from "./rg";
import { VoterId } from "./voter-id";

type Parser = (raw: string) => Result<unknown, DomainError>;

// Literals computed by an independent implementation, cross-read against validations-br and brazilian-utils.
const KNOWN_VALID: readonly [string, Parser, string][] = [
  ["CPF", Cpf.parse, "52998224725"],
  ["CNPJ", Cnpj.parse, "11222333000181"],
  ["PIS", Pis.parse, "12034567899"],
  ["CNH", Cnh.parse, "12345678900"],
  ["CNH dsc branch", Cnh.parse, "10000000109"],
  ["Voter ID SP", VoterId.parse, "123456780191"],
  ["Voter ID SP zero-to-one", VoterId.parse, "100000010116"],
  ["Voter ID RS", VoterId.parse, "000000010493"],
  ["RG", Rg.parse, "246781312"],
  ["RG X", Rg.parse, "10000006X"],
];

function errorCode(result: Result<unknown, DomainError>): string | undefined {
  return result.ok ? undefined : result.error.code;
}

function bumpLastDigit(value: string): string {
  const last = Number(value.slice(-1));
  return value.slice(0, -1) + String((last + 1) % 10);
}

describe("document known values", () => {
  it("known valid literals parse", () => {
    for (const [label, parse, value] of KNOWN_VALID) {
      expect(parse(value).ok, label).toBe(true);
    }
  });

  it("wrong check digit is rejected", () => {
    const cases: readonly [Parser, string][] = [
      [Cpf.parse, "52998224725"],
      [Cnpj.parse, "11222333000181"],
      [Pis.parse, "12034567899"],
      [Cnh.parse, "12345678900"],
      [VoterId.parse, "123456780191"],
    ];
    for (const [parse, value] of cases) {
      expect(errorCode(parse(bumpLastDigit(value))), value).toBe("INVALID_CHECK_DIGIT");
    }
  });

  it("repeated digits are rejected", () => {
    expect(errorCode(Cpf.parse("111.111.111-11"))).toBe("INVALID_CHECK_DIGIT");
    expect(errorCode(Cpf.parse("00000000000"))).toBe("INVALID_CHECK_DIGIT");
    expect(errorCode(Cnpj.parse("11.111.111/1111-11"))).toBe("INVALID_CHECK_DIGIT");
  });

  it("wrong length is rejected", () => {
    const cases: readonly [Parser, string][] = [
      [Cpf.parse, "5299822472"],
      [Cnpj.parse, "1122233300018"],
      [Pis.parse, "120345678990"],
      [Cnh.parse, "1234567890"],
      [VoterId.parse, "12345678019"],
      [Cep.parse, "0131010"],
    ];
    for (const [parse, value] of cases) {
      expect(errorCode(parse(value)), value).toBe("INVALID_LENGTH");
    }
  });

  it("foreign characters are rejected", () => {
    expect(errorCode(Cpf.parse("529.982.247-2a"))).toBe("INVALID_FORMAT");
    expect(errorCode(Cpf.parse("529,982,247-25"))).toBe("INVALID_FORMAT");
  });
});
