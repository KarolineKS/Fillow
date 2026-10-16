/**
 * Deterministic pseudo-random number generator (mulberry32).
 *
 * The generator services depend on this instead of `Math.random` so that
 * generation is reproducible under a given seed, which keeps unit tests
 * stable and lets batch runs guarantee non-colliding personas.
 */

export interface RandomSource {
  /** Next float in the half-open interval [0, 1). */
  next(): number;
  /** Next integer in the inclusive range [min, max]. */
  nextInt(min: number, max: number): number;
  /** Pick a uniformly random element from a non-empty array. */
  pick<T>(items: readonly T[]): T;
}

export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
    // Normalize the seed into a non-zero 32-bit unsigned integer.
    this.state = (seed >>> 0) || 0x9e3779b9;
  }

  next(): number {
    this.state = (this.state + 0x6d2b79f5) | 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  nextInt(min: number, max: number): number {
    if (max < min) {
      throw new RangeError("max must be greater than or equal to min");
    }
    return min + Math.floor(this.next() * (max - min + 1));
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new RangeError("cannot pick from an empty array");
    }
    const index = this.nextInt(0, items.length - 1);
    // Safe: index is bounded within the array length.
    return items[index] as T;
  }
}
