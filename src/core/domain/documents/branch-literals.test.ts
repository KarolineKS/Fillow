import { describe, expect, it } from "vitest";
import type { DomainError } from "../shared/domain-error";
import type { Result } from "../shared/result";
import { Cnh } from "./cnh";
import { Rg } from "./rg";
import { VoterId } from "./voter-id";

function bumpLast(value: string): string {
  const last = value.slice(-1);
  return value.slice(0, -1) + (last === "X" ? "0" : String((Number(last) + 1) % 10));
}

function code(result: Result<unknown, DomainError>): string | undefined {
  return result.ok ? undefined : result.error.code;
}

describe("branch-specific literals", () => {
  it("branch literals reject a wrong check digit", () => {
    const cases: readonly [(raw: string) => Result<unknown, DomainError>, string][] = [
      [Cnh.parse, "10000000109"],
      [VoterId.parse, "100000010116"],
      [VoterId.parse, "000000010493"],
      [Rg.parse, "246781312"],
      [Rg.parse, "10000006X"],
    ];
    for (const [parse, valid] of cases) {
      expect(parse(valid).ok, valid).toBe(true);
      expect(code(parse(bumpLast(valid))), bumpLast(valid)).toBe("INVALID_CHECK_DIGIT");
    }
  });
});
