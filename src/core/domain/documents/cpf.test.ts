import { describe, expect, it } from "vitest";
import { Cpf } from "./cpf";

describe("Cpf", () => {
  it("parses masked and digits-only", () => {
    for (const raw of ["529.982.247-25", "52998224725"]) {
      const result = Cpf.parse(raw);
      expect(result).toEqual({ ok: true, value: { digits: "52998224725", formatted: "529.982.247-25" } });
    }
  });
});
