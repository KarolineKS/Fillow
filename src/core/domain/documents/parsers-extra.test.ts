import { describe, expect, it } from "vitest";
import { CreditCard } from "./credit-card";
import { PhoneBr } from "./phone-br";
import { Rg } from "./rg";
import { VoterId } from "./voter-id";

function code(result: { ok: true } | { ok: false; error: { code: string } }): string | undefined {
  return result.ok ? undefined : result.error.code;
}

describe("parsers beyond the checks", () => {
  it("phone parse accepts masks and rejects bad shapes", () => {
    expect(PhoneBr.parse("(11) 98765-4321")).toEqual({
      ok: true,
      value: { digits: "11987654321", formatted: "(11) 98765-4321", kind: "mobile" },
    });
    expect(PhoneBr.parse("(51) 3222-1234")).toEqual({
      ok: true,
      value: { digits: "5132221234", formatted: "(51) 3222-1234", kind: "landline" },
    });
    expect(code(PhoneBr.parse("+55 11 98765-4321"))).toBe("INVALID_FORMAT");
    expect(code(PhoneBr.parse("119876543"))).toBe("INVALID_LENGTH");
    expect(code(PhoneBr.parse("20987654321"))).toBe("INVALID_FORMAT");
    expect(code(PhoneBr.parse("11887654321"))).toBe("INVALID_FORMAT");
    expect(code(PhoneBr.parse("5192221234"))).toBe("INVALID_FORMAT");
  });

  it("credit card parse checks brand and luhn", () => {
    expect(CreditCard.parse("4111 1111 1111 1111")).toEqual({
      ok: true,
      value: { digits: "4111111111111111", brand: "visa" },
    });
    expect(CreditCard.parse("378282246310005")).toEqual({ ok: true, value: { digits: "378282246310005", brand: "amex" } });
    expect(code(CreditCard.parse("4111111111111112"))).toBe("INVALID_CHECK_DIGIT");
    expect(code(CreditCard.parse("6011111111111117"))).toBe("INVALID_FORMAT");
    expect(code(CreditCard.parse("4111-1111-1111-111a"))).toBe("INVALID_FORMAT");
  });

  it("rg parse handles masks, lowercase x and misplaced x", () => {
    expect(Rg.parse("10.000.006-x")).toEqual({ ok: true, value: { value: "10000006X", formatted: "10.000.006-X" } });
    expect(code(Rg.parse("1000X0069"))).toBe("INVALID_FORMAT");
    expect(code(Rg.parse("24678131"))).toBe("INVALID_LENGTH");
    expect(code(Rg.parse("246781313"))).toBe("INVALID_CHECK_DIGIT");
  });

  it("voter id rejects unknown uf codes", () => {
    expect(code(VoterId.parse("123456782991"))).toBe("INVALID_STATE_UF");
  });
});
