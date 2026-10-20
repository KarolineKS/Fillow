import { describe, expect, it } from "vitest";
import { SeededRandom, type RandomSource } from "../shared/seeded-random";
import { DeterministicGeneratorService } from "./deterministic-generator-service";
import type { Persona } from "./persona";

const REFERENCE = "2026-10-19";

function batch(count: number, random: RandomSource) {
  return DeterministicGeneratorService.generatePersonas({ referenceDate: REFERENCE, count }, random);
}

function personas(count: number, seed: number): Persona[] {
  const result = batch(count, new SeededRandom(seed));
  if (!result.ok) {
    throw new Error(`expected ok, got ${result.error.code}`);
  }
  return result.value;
}

const constantRandom: RandomSource = {
  next: () => 0.5,
  nextInt: (min, max) => min + Math.floor(0.5 * (max - min + 1)),
  pick: <T>(items: readonly T[]): T => items[Math.floor(items.length / 2)] as T,
};

describe("generatePersonas", () => {
  it("batch length matches count", () => {
    expect(personas(1, 1)).toHaveLength(1);
    expect(personas(50, 1)).toHaveLength(50);
  });

  it("batch unique fields never collide", () => {
    for (let seed = 1; seed <= 200; seed += 1) {
      const people = personas(50, seed);
      const fields: readonly ((person: Persona) => string)[] = [
        (person) => person.cpf,
        (person) => person.pis,
        (person) => person.ctps.number,
        (person) => person.email,
      ];
      for (const field of fields) {
        expect(new Set(people.map(field)).size).toBe(50);
      }
    }
  });

  it("invalid count is rejected", () => {
    for (const count of [0, 51, 2.5]) {
      const result = batch(count, new SeededRandom(1));
      expect(result.ok ? undefined : result.error.code, String(count)).toBe("OUT_OF_RANGE");
    }
  });

  it("exhausted uniqueness fails instead of duplicating", () => {
    const result = batch(2, constantRandom);
    expect(result.ok).toBe(false);
    expect(result.ok ? undefined : result.error.code).toBe("GENERATION_FAILED");
  });
});
