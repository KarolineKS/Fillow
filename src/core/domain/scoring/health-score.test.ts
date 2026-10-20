import { describe, expect, it } from "vitest";
import { HealthScore } from "./health-score";

describe("HealthScore", () => {
  it("health score bounds", () => {
    expect(HealthScore.create(0)).toEqual({ ok: true, value: { value: 0 } });
    expect(HealthScore.create(100)).toEqual({ ok: true, value: { value: 100 } });
    for (const value of [-1, 101, 50.5]) {
      const result = HealthScore.create(value);
      expect(result.ok ? undefined : result.error.code, String(value)).toBe("OUT_OF_RANGE");
    }
  });
});
