import { describe, expect, it } from "vitest";
import { Email } from "./email";

describe("Email", () => {
  it("email format", () => {
    expect(Email.parse("ana.souza@example.com")).toEqual({ ok: true, value: { value: "ana.souza@example.com" } });
    for (const raw of ["ana.example.com", "ana@@example.com", "a@b@example.com", "ana@example"]) {
      const result = Email.parse(raw);
      expect(result.ok ? undefined : result.error.code, raw).toBe("INVALID_FORMAT");
    }
  });
});
