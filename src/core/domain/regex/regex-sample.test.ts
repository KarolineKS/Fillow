import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { RegexSampleGeneratorService } from "./regex-sample-generator-service";

const PATTERNS = [
  "[0-9]{5}-?[0-9]{3}",
  "[A-Z]{3}[0-9][A-Z0-9][0-9]{2}",
  "(foo|bar)+\\d{2,4}",
  "[^aeiou]{3}",
  "\\w+@\\w+\\.com",
  "a.c",
  "(?:ab)*c?",
  "x{2,}",
] as const;

const SEEDS = Array.from({ length: 1000 }, (_, index) => index + 1);

function browserAccepts(pattern: string, value: string): boolean {
  return new RegExp(`^(?:${pattern})$`, "v").test(value);
}

function errorCode(result: { ok: true } | { ok: false; error: { code: string } }): string | undefined {
  return result.ok ? undefined : result.error.code;
}

describe("RegexSampleGeneratorService", () => {
  it("matching samples satisfy native regexp", () => {
    for (const pattern of PATTERNS) {
      for (const seed of SEEDS) {
        const result = RegexSampleGeneratorService.matching(pattern, new SeededRandom(seed));
        if (!result.ok) {
          throw new Error(`${pattern} seed ${seed}: ${result.error.code}`);
        }
        expect(browserAccepts(pattern, result.value), `${pattern} -> ${JSON.stringify(result.value)}`).toBe(true);
      }
    }
  });

  it("violating samples fail native regexp", () => {
    for (const pattern of PATTERNS) {
      for (const seed of SEEDS) {
        const result = RegexSampleGeneratorService.violating(pattern, new SeededRandom(seed));
        if (!result.ok) {
          throw new Error(`${pattern} seed ${seed}: ${result.error.code}`);
        }
        expect(browserAccepts(pattern, result.value), `${pattern} -> ${JSON.stringify(result.value)}`).toBe(false);
      }
    }
  });

  it("unsupported constructs are rejected", () => {
    for (const pattern of ["(?=a)b", "(?!a)b", "(?<=a)b", "(?<!a)b", "(a)\\1", "\\p{L}+"]) {
      expect(errorCode(RegexSampleGeneratorService.matching(pattern, new SeededRandom(1))), pattern).toBe(
        "UNSUPPORTED_PATTERN",
      );
    }
  });

  it("invalid pattern is rejected", () => {
    for (const pattern of ["[a-", "(ab"]) {
      expect(errorCode(RegexSampleGeneratorService.matching(pattern, new SeededRandom(1))), pattern).toBe(
        "INVALID_FORMAT",
      );
    }
  });

  it("match-everything pattern cannot be violated", () => {
    expect(errorCode(RegexSampleGeneratorService.violating(".*", new SeededRandom(1)))).toBe("GENERATION_FAILED");
  });
});
