import { describe, expect, it } from "vitest";
import { Result } from "./result";

describe("Result", () => {
  it("result combinators", () => {
    const ok = Result.ok<number>(2);
    const err = Result.err<string>("boom");

    expect(Result.all([Result.ok(1), Result.ok(2)])).toEqual({ ok: true, value: [1, 2] });
    expect(Result.all<number, string>([Result.ok(1), Result.err("first"), Result.err("second")])).toEqual({
      ok: false,
      error: "first",
    });
    expect(Result.all([])).toEqual({ ok: true, value: [] });

    expect(Result.map(ok, (value) => value * 10)).toEqual({ ok: true, value: 20 });
    expect(Result.map<number, string, number>(err, (value) => value * 10)).toBe(err);

    expect(Result.flatMap(ok, (value) => Result.ok(value + 1))).toEqual({ ok: true, value: 3 });
    expect(Result.flatMap(ok, () => Result.err("inner"))).toEqual({ ok: false, error: "inner" });
    expect(Result.flatMap<number, string, number>(err, (value) => Result.ok(value))).toBe(err);

    expect(Result.mapErr(err, (error) => error.toUpperCase())).toEqual({ ok: false, error: "BOOM" });
    expect(Result.mapErr<number, string, string>(ok, (error) => error.toUpperCase())).toBe(ok);

    expect(Result.unwrapOr(ok, 0)).toBe(2);
    expect(Result.unwrapOr<number, string>(err, 0)).toBe(0);
    expect(Result.isOk(ok)).toBe(true);
    expect(Result.isErr(err)).toBe(true);
  });
});
