import { describe, expect, it } from "vitest";
import { SeededRandom } from "../shared/seeded-random";
import { DeterministicGeneratorService } from "./deterministic-generator-service";

describe("persona email domains", () => {
  it("every reserved domain is used", () => {
    const domains = new Set<string>();
    for (let seed = 1; seed <= 200; seed += 1) {
      const result = DeterministicGeneratorService.generatePersona(
        { referenceDate: "2026-10-19" },
        new SeededRandom(seed),
      );
      if (result.ok) {
        domains.add(result.value.email.split("@")[1] ?? "");
      }
    }
    expect([...domains].sort()).toEqual(["example.com", "example.net", "example.org"]);
  });
});
