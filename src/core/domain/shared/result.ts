/**
 * Explicit, exception-free error handling across domain boundaries.
 *
 * The domain never throws across its public surface; it returns a `Result`
 * so callers must handle both the success and failure branches explicitly.
 */

export interface Ok<T> {
  readonly ok: true;
  readonly value: T;
}

export interface Err<E> {
  readonly ok: false;
  readonly error: E;
}

export type Result<T, E> = Ok<T> | Err<E>;

export const Result = {
  ok<T>(value: T): Ok<T> {
    return { ok: true, value };
  },

  err<E>(error: E): Err<E> {
    return { ok: false, error };
  },

  isOk<T, E>(result: Result<T, E>): result is Ok<T> {
    return result.ok;
  },

  isErr<T, E>(result: Result<T, E>): result is Err<E> {
    return !result.ok;
  },

  /** Transform the success value, leaving failures untouched. */
  map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    return result.ok ? Result.ok(fn(result.value)) : result;
  },

  /** Transform the error, leaving successes untouched. */
  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    return result.ok ? result : Result.err(fn(result.error));
  },

  /** Chain a fallible operation that itself returns a `Result`. */
  flatMap<T, E, U>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    return result.ok ? fn(result.value) : result;
  },

  /** Extract the success value or fall back to the provided default. */
  unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
    return result.ok ? result.value : fallback;
  },

  /**
   * Collect an array of results into a single result of an array.
   * Fails fast on the first error encountered.
   */
  all<T, E>(results: readonly Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (!result.ok) {
        return result;
      }
      values.push(result.value);
    }
    return Result.ok(values);
  },
} as const;
