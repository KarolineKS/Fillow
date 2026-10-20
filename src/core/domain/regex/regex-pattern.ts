import { DomainError } from "../shared/domain-error";
import { Result } from "../shared/result";

/** Code point ranges, inclusive; `negated` inverts membership. */
export interface CharSet {
  readonly negated: boolean;
  readonly ranges: readonly (readonly [number, number])[];
}

export type RegexNode =
  | { readonly type: "empty" }
  | { readonly type: "char"; readonly codePoint: number }
  | { readonly type: "class"; readonly negated: boolean; readonly items: readonly CharSet[] }
  | { readonly type: "sequence"; readonly items: readonly RegexNode[] }
  | { readonly type: "alternation"; readonly options: readonly RegexNode[] }
  | { readonly type: "repeat"; readonly node: RegexNode; readonly min: number; readonly max: number };

/** An HTML `pattern` attribute: anchored and compiled with the `v` flag, as browsers do. */
export interface RegexPattern {
  readonly source: string;
  readonly matcher: RegExp;
  readonly ast: RegexNode;
}

const DIGIT: CharSet = { negated: false, ranges: [[48, 57]] };
const WORD: CharSet = { negated: false, ranges: [[48, 57], [65, 90], [95, 95], [97, 122]] };
const SPACE: CharSet = {
  negated: false,
  ranges: [[9, 13], [32, 32], [160, 160], [0x1680, 0x1680], [0x2000, 0x200a], [0x2028, 0x2029],
    [0x202f, 0x202f], [0x205f, 0x205f], [0x3000, 0x3000], [0xfeff, 0xfeff]],
};
const LINE_TERMINATORS: CharSet = { negated: true, ranges: [[10, 10], [13, 13], [0x2028, 0x2029]] };

const CONTROL_ESCAPES: Readonly<Record<string, number>> = { t: 9, n: 10, v: 11, f: 12, r: 13, "0": 0 };

class UnsupportedConstruct extends Error {}

function negate(set: CharSet): CharSet {
  return { negated: !set.negated, ranges: set.ranges };
}

class PatternParser {
  private position = 0;

  constructor(private readonly source: string) {}

  parse(): RegexNode {
    const node = this.alternation();
    if (this.position < this.source.length) {
      throw new UnsupportedConstruct(`unbalanced ")" at ${this.position}`);
    }
    return node;
  }

  private peek(offset = 0): string | undefined {
    return this.source[this.position + offset];
  }

  private startsWith(token: string): boolean {
    return this.source.startsWith(token, this.position);
  }

  private nextCodePoint(): number {
    const codePoint = this.source.codePointAt(this.position) ?? 0;
    this.position += codePoint > 0xffff ? 2 : 1;
    return codePoint;
  }

  private alternation(): RegexNode {
    const options = [this.sequence()];
    while (this.peek() === "|") {
      this.position += 1;
      options.push(this.sequence());
    }
    return options.length === 1 ? (options[0] as RegexNode) : { type: "alternation", options };
  }

  private sequence(): RegexNode {
    const items: RegexNode[] = [];
    while (this.position < this.source.length && this.peek() !== "|" && this.peek() !== ")") {
      items.push(this.quantified(this.atom()));
    }
    return { type: "sequence", items };
  }

  private atom(): RegexNode {
    const character = this.peek();
    if (character === "(") {
      return this.group();
    }
    if (character === "[") {
      return this.characterClass();
    }
    if (character === ".") {
      this.position += 1;
      return { type: "class", negated: false, items: [LINE_TERMINATORS] };
    }
    if (character === "^" || character === "$") {
      this.position += 1;
      return { type: "empty" };
    }
    if (character === "\\") {
      this.position += 1;
      const escaped = this.atomEscape();
      return "codePoint" in escaped ? { type: "char", codePoint: escaped.codePoint } : { type: "class", negated: false, items: [escaped] };
    }
    return { type: "char", codePoint: this.nextCodePoint() };
  }

  private group(): RegexNode {
    if (this.startsWith("(?=") || this.startsWith("(?!") || this.startsWith("(?<=") || this.startsWith("(?<!")) {
      throw new UnsupportedConstruct("lookaround");
    }
    if (this.startsWith("(?:")) {
      this.position += 3;
    } else if (this.startsWith("(?<")) {
      const close = this.source.indexOf(">", this.position);
      this.position = close + 1;
    } else if (this.startsWith("(?")) {
      throw new UnsupportedConstruct("group modifier");
    } else {
      this.position += 1;
    }
    const inner = this.alternation();
    this.position += 1; // ")" - balance is guaranteed by the native compile that ran first
    return inner;
  }

  private quantified(node: RegexNode): RegexNode {
    const character = this.peek();
    let bounds: [number, number] | undefined;
    if (character === "*") {
      bounds = [0, Infinity];
      this.position += 1;
    } else if (character === "+") {
      bounds = [1, Infinity];
      this.position += 1;
    } else if (character === "?") {
      bounds = [0, 1];
      this.position += 1;
    } else if (character === "{") {
      const match = /^\{(\d+)(,(\d*))?\}/.exec(this.source.slice(this.position));
      if (match !== null) {
        const min = Number(match[1]);
        const max = match[2] === undefined ? min : match[3] === "" ? Infinity : Number(match[3]);
        bounds = [min, max];
        this.position += match[0].length;
      }
    }
    if (bounds === undefined) {
      return node;
    }
    if (this.peek() === "?") {
      this.position += 1; // lazy and greedy accept the same strings
    }
    return { type: "repeat", node, min: bounds[0], max: bounds[1] };
  }

  /** After a backslash outside a class. */
  private atomEscape(): CharSet | { codePoint: number } {
    const character = this.peek() ?? "";
    if (/[1-9]/.test(character) || character === "k") {
      throw new UnsupportedConstruct("backreference");
    }
    if (character === "b" || character === "B") {
      throw new UnsupportedConstruct("word boundary");
    }
    return this.sharedEscape();
  }

  /** Escapes valid both inside and outside a class. */
  private sharedEscape(): CharSet | { codePoint: number } {
    const character = this.peek() ?? "";
    this.position += 1;
    switch (character) {
      case "d": return DIGIT;
      case "D": return negate(DIGIT);
      case "w": return WORD;
      case "W": return negate(WORD);
      case "s": return SPACE;
      case "S": return negate(SPACE);
      case "p":
      case "P":
        throw new UnsupportedConstruct("unicode property escape");
      case "q":
        throw new UnsupportedConstruct("class string disjunction");
      case "c": {
        const letter = this.nextCodePoint();
        return { codePoint: letter % 32 };
      }
      case "x": {
        const hex = this.source.slice(this.position, this.position + 2);
        this.position += 2;
        return { codePoint: parseInt(hex, 16) };
      }
      case "u": {
        if (this.peek() === "{") {
          const close = this.source.indexOf("}", this.position);
          const hex = this.source.slice(this.position + 1, close);
          this.position = close + 1;
          return { codePoint: parseInt(hex, 16) };
        }
        const hex = this.source.slice(this.position, this.position + 4);
        this.position += 4;
        return { codePoint: parseInt(hex, 16) };
      }
      default: {
        const control = CONTROL_ESCAPES[character];
        if (control !== undefined) {
          return { codePoint: control };
        }
        this.position -= 1;
        return { codePoint: this.nextCodePoint() };
      }
    }
  }

  private characterClass(): RegexNode {
    this.position += 1;
    const negated = this.peek() === "^";
    if (negated) {
      this.position += 1;
    }
    const items: CharSet[] = [];
    while (this.peek() !== "]") {
      if (this.peek() === "[" || this.startsWith("&&") || this.startsWith("--")) {
        throw new UnsupportedConstruct("nested class or set operation");
      }
      const low = this.classAtom();
      if (!("codePoint" in low)) {
        items.push(low);
        continue;
      }
      if (this.peek() === "-" && this.peek(1) !== "]") {
        this.position += 1;
        const high = this.classAtom();
        if (!("codePoint" in high)) {
          throw new UnsupportedConstruct("range ending in a class escape");
        }
        items.push({ negated: false, ranges: [[low.codePoint, high.codePoint]] });
      } else {
        items.push({ negated: false, ranges: [[low.codePoint, low.codePoint]] });
      }
    }
    this.position += 1;
    return { type: "class", negated, items };
  }

  private classAtom(): CharSet | { codePoint: number } {
    if (this.peek() !== "\\") {
      return { codePoint: this.nextCodePoint() };
    }
    this.position += 1;
    if (this.peek() === "b") {
      this.position += 1;
      return { codePoint: 8 };
    }
    return this.sharedEscape();
  }
}

export const RegexPattern = {
  parse(source: string): Result<RegexPattern, DomainError> {
    let matcher: RegExp;
    try {
      matcher = new RegExp(`^(?:${source})$`, "v");
    } catch {
      return Result.err(DomainError.invalidFormat(`"${source}" is not a valid pattern under the v flag`));
    }
    try {
      return Result.ok({ source, matcher, ast: new PatternParser(source).parse() });
    } catch (error) {
      if (error instanceof UnsupportedConstruct) {
        return Result.err(DomainError.unsupportedPattern(`"${source}" uses an unsupported construct: ${error.message}`));
      }
      throw error;
    }
  },
} as const;
