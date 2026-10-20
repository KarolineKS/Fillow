import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";
import type { RandomSource } from "../shared/seeded-random";
import { RegexPattern, type CharSet, type RegexNode } from "./regex-pattern";

/**
 * Characters a person can type into a single-line input: printable ASCII plus common
 * Portuguese letters. Line terminators are excluded because `<input>` strips them.
 */
const TYPABLE: readonly number[] = [
  ...Array.from({ length: 0x7e - 0x20 + 1 }, (_, index) => 0x20 + index),
  ..."áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ€".split("").map((character) => character.codePointAt(0) ?? 0),
];

const FOREIGN = ["!", "a", "Z", "0", " ", "é", "-", "_", "@", "."] as const;
const MAX_EXTRA_REPEATS = 3;
const MATCH_ATTEMPTS = 20;

function inSet(set: CharSet, codePoint: number): boolean {
  const inside = set.ranges.some(([low, high]) => codePoint >= low && codePoint <= high);
  return inside !== set.negated;
}

function inClass(node: Extract<RegexNode, { type: "class" }>, codePoint: number): boolean {
  return node.items.some((item) => inSet(item, codePoint)) !== node.negated;
}

function sampleClass(node: Extract<RegexNode, { type: "class" }>, random: RandomSource): string | undefined {
  const typable = TYPABLE.filter((codePoint) => inClass(node, codePoint));
  if (typable.length > 0) {
    return String.fromCodePoint(random.pick(typable));
  }
  const positive = node.negated ? [] : node.items.filter((item) => !item.negated).flatMap((item) => item.ranges);
  if (positive.length === 0) {
    return undefined;
  }
  const [low, high] = random.pick(positive);
  return String.fromCodePoint(random.nextInt(low, high));
}

function sample(node: RegexNode, random: RandomSource): string | undefined {
  switch (node.type) {
    case "empty":
      return "";
    case "char":
      return String.fromCodePoint(node.codePoint);
    case "class":
      return sampleClass(node, random);
    case "alternation":
      return sample(random.pick(node.options), random);
    case "sequence": {
      let output = "";
      for (const item of node.items) {
        const part = sample(item, random);
        if (part === undefined) {
          return undefined;
        }
        output += part;
      }
      return output;
    }
    case "repeat": {
      const ceiling = Math.min(node.max, node.min + MAX_EXTRA_REPEATS);
      const count = random.nextInt(node.min, ceiling);
      let output = "";
      for (let index = 0; index < count; index += 1) {
        const part = sample(node.node, random);
        if (part === undefined) {
          return undefined;
        }
        output += part;
      }
      return output;
    }
  }
}

function matchingSample(pattern: RegexPattern, random: RandomSource): string | undefined {
  for (let attempt = 0; attempt < MATCH_ATTEMPTS; attempt += 1) {
    const candidate = sample(pattern.ast, random);
    if (candidate !== undefined && pattern.matcher.test(candidate)) {
      return candidate;
    }
  }
  return undefined;
}

/** Smallest edits first: a value one keystroke away from valid is the useful boundary test. */
function violationCandidates(seed: string, random: RandomSource): string[] {
  const characters = [...seed];
  const offset = characters.length === 0 ? 0 : random.nextInt(0, characters.length - 1);
  const candidates: string[] = [];
  for (let step = 0; step < characters.length; step += 1) {
    const index = (offset + step) % characters.length;
    for (const foreign of FOREIGN) {
      candidates.push([...characters.slice(0, index), foreign, ...characters.slice(index + 1)].join(""));
    }
  }
  for (const foreign of FOREIGN) {
    candidates.push(seed + foreign, foreign + seed);
  }
  if (characters.length > 0) {
    candidates.push(characters.slice(0, -1).join(""), characters.slice(1).join(""));
  }
  candidates.push("", ...FOREIGN, seed + seed);
  return candidates;
}

function withPattern(
  source: string,
  produce: (pattern: RegexPattern) => Result<string, DomainError>,
): Result<string, DomainError> {
  return Result.flatMap(RegexPattern.parse(source), produce);
}

export const RegexSampleGeneratorService = {
  /** A string the browser's `pattern` check accepts. */
  matching(source: string, random: RandomSource): Result<string, DomainError> {
    return withPattern(source, (pattern) => {
      const value = matchingSample(pattern, random);
      return value === undefined
        ? Result.err(DomainError.generationFailed(`No matching sample found for "${source}"`))
        : Result.ok(value);
    });
  },

  /** A typable string the browser's `pattern` check rejects. */
  violating(source: string, random: RandomSource): Result<string, DomainError> {
    return withPattern(source, (pattern) => {
      const seed = matchingSample(pattern, random) ?? "";
      const value = violationCandidates(seed, random).find((candidate) => !pattern.matcher.test(candidate));
      return value === undefined
        ? Result.err(
            DomainError.generationFailed(
              `"${source}" accepts every typable value, so no violating sample exists`,
              "This pattern does not restrict anything a person can type, so it cannot block bad input.",
            ),
          )
        : Result.ok(value);
    });
  },
} as const;
