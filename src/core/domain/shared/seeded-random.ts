export interface RandomSource {
  next(): number;
  nextInt(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
}

/**
 * mulberry32 PRNG, chosen over the unseeded global generator so generation is reproducible
 * under a given seed, keeping tests stable and batch personas non-colliding.
 */
export class SeededRandom implements RandomSource {
  private state: number;

  constructor(seed: number) {
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
    return items[this.nextInt(0, items.length - 1)] as T;
  }
}
