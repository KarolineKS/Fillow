import { describe, expect, it } from "vitest";
import { Ctps } from "./ctps";

describe("Ctps", () => {
  it("ctps format", () => {
    expect(Ctps.parse({ number: "1234567", series: "0012", stateUf: "SP" })).toEqual({
      ok: true,
      value: { number: "1234567", series: "0012", stateUf: "SP" },
    });
    const short = Ctps.parse({ number: "123456", series: "0012", stateUf: "SP" });
    expect(short.ok ? undefined : short.error.code).toBe("INVALID_LENGTH");
    const badUf = Ctps.parse({ number: "1234567", series: "0012", stateUf: "XX" });
    expect(badUf.ok ? undefined : badUf.error.code).toBe("INVALID_STATE_UF");
  });
});
