/// <reference types="vite/client" />
import { describe, expect, it } from "vitest";

const sources = import.meta.glob<string>(["/src/core/**/*.ts", "!/src/core/**/*.test.ts"], {
  query: "?raw",
  import: "default",
  eager: true,
});

const FORBIDDEN: readonly [string, RegExp][] = [
  ["Math.random", /Math\.random/],
  ["Date.now", /Date\.now/],
  ["new Date()", /new Date\(\s*\)/],
  ["chrome.", /\bchrome\./],
  ["document.", /\bdocument\./],
  ["window.", /\bwindow\./],
  ["react import", /from\s+["']react(?:-dom)?(?:\/[^"']*)?["']/],
];

describe("domain boundary", () => {
  it("core has no clock, random, browser or react access", () => {
    const files = Object.keys(sources);
    expect(files.length).toBeGreaterThan(0);

    const violations: string[] = [];
    for (const [file, content] of Object.entries(sources)) {
      for (const [label, pattern] of FORBIDDEN) {
        if (pattern.test(content)) {
          violations.push(`${file}: ${label}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
