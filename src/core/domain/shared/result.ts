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

  map<T, E, U>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
    return result.ok ? Result.ok(fn(result.value)) : result;
  },

  mapErr<T, E, F>(result: Result<T, E>, fn: (error: E) => F): Result<T, F> {
    return result.ok ? result : Result.err(fn(result.error));
  },

  flatMap<T, E, U>(
    result: Result<T, E>,
    fn: (value: T) => Result<U, E>,
  ): Result<U, E> {
    return result.ok ? fn(result.value) : result;
  },

  unwrapOr<T, E>(result: Result<T, E>, fallback: T): T {
    return result.ok ? result.value : fallback;
  },

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
