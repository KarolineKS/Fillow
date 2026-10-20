import { describe, expect, it } from "vitest";
import { Cnpj } from "./cnpj";

describe("Cnpj", () => {
  it("parses masked and digits-only", () => {
    for (const raw of ["11.222.333/0001-81", "11222333000181"]) {
      expect(Cnpj.parse(raw)).toEqual({
        ok: true,
        value: { digits: "11222333000181", formatted: "11.222.333/0001-81" },
      });
    }
  });
});
