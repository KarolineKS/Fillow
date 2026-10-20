import { describe, expect, it } from "vitest";
import { FuzzingCatalogService } from "./fuzzing-catalog-service";
import type { TestPayload } from "./test-payload";

function catalog(): TestPayload[] {
  const result = FuzzingCatalogService.catalog();
  if (!result.ok) {
    throw new Error("catalog failed");
  }
  return result.value;
}

describe("fuzzing catalog", () => {
  it("catalog has every required vector", () => {
    const entries = catalog();
    for (const entry of entries) {
      expect(entry.kind).toBe("fuzz");
    }
    const values = entries.map((entry) => entry.value);
    const required: readonly [string, (value: string) => boolean][] = [
      ["501 chars", (value) => value.length === 501],
      ["empty", (value) => value === ""],
      ["whitespace only", (value) => value.length > 0 && value.trim() === ""],
      ["emoji", (value) => /\p{Extended_Pictographic}/u.test(value)],
      ["rtl override", (value) => value.includes("‮")],
      ["-1", (value) => value === "-1"],
      ["0", (value) => value === "0"],
      ["20 digits", (value) => /^\d{20}$/.test(value)],
      ["xss", (value) => value.includes("<script")],
      ["sqli", (value) => value.includes("' OR '1'='1")],
    ];
    for (const [label, matches] of required) {
      expect(values.some(matches), label).toBe(true);
    }
  });

  it("catalog has no destructive token", () => {
    for (const { value } of catalog()) {
      for (const token of ["drop", "delete", "truncate", "update", "alert("]) {
        expect(value.toLowerCase().includes(token), `${token} in ${value}`).toBe(false);
      }
    }
  });

  it("reason codes distinct and explained", () => {
    const entries = catalog();
    expect(new Set(entries.map((entry) => entry.reasonCode)).size).toBe(entries.length);
    for (const entry of entries) {
      expect(entry.explanation.trim().length).toBeGreaterThan(0);
    }
  });
});
