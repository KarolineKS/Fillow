import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { RegexSampleGeneratorService } from "./regex-sample-generator-service";

const PATTERNS = [
  "\\x41\\u0042\\u{43}\\t?",
  "[\\d\\s\\w\\-]{2}",
  "[\\D][\\W][\\S]",
  "\\.\\/\\$",
  "(?<code>[a-c]{2})",
  "[α-ω]{2}",
  "^ab$",
  "a{2}b{1,3}?",
] as const;

describe("regex constructs beyond the checks", () => {
  it("escapes, named groups and non-typable classes still produce matching samples", () => {
    for (const pattern of PATTERNS) {
      for (let seed = 1; seed <= 100; seed += 1) {
        const result = RegexSampleGeneratorService.matching(pattern, new SeededRandom(seed));
        if (!result.ok) {
          throw new Error(`${pattern}: ${result.error.code}`);
        }
        expect(new RegExp(`^(?:${pattern})$`, "v").test(result.value), `${pattern} -> ${result.value}`).toBe(true);
      }
    }
  });

  it("word boundaries, nested classes and group modifiers are unsupported", () => {
    for (const pattern of ["a\\bb", "[[a-z]--[aeiou]]", "\\k<x>(?<x>a)", "[\\q{abc}]"]) {
      const result = RegexSampleGeneratorService.matching(pattern, new SeededRandom(1));
      expect(result.ok ? undefined : result.error.code, pattern).toBe("UNSUPPORTED_PATTERN");
    }
  });
});
