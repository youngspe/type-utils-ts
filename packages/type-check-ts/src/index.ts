import type { DisableOverloadIfExtends, IsSameType, IsSameTypeStrict } from './helpers.js';

interface TypeResultBase<in out B extends boolean> {
  pass: B;
}

/** Basic return type of a type checking function. */
export type TypeResult = TypeResult.Pass | TypeResult.Fail<any>;

export namespace TypeResult {
  export interface Pass extends TypeResultBase<true> {}
  export interface Fail<Msg = unknown> extends TypeResultBase<false> {}
}

/** Either `R` or an object or array of {@link NestedResult}s. */
export type NestedResult<R extends TypeResult = TypeResult> = R | NestedResultObject<R>;

/** An object or array of {@linkcode NestedResult<R>}s. */
export type NestedResultObject<R extends TypeResult = TypeResult> =
  { [k: PropertyKey]: NestedResult<R> } | readonly NestedResult<R>[];

export type Valid = NestedResult<TypeResult.Pass>;

/**
 * Entry point for type checks. Causes a compile-time error if the body function does not return {@link Valid}.
 *
 * This function does nothing at runtime; {@linkcode checkFn} will never actually be called.
 *
 * @example <caption>Verifying correctness of a "branded string" type</caption>
 * declare const MARKER: unique symbol;
 * export type BrandedString<M> = string & { [MARKER]: M };
 * export const BrandedString = <M>(value: string) => value as BrandedString<M>;
 *
 * Check(<T, U>() => ({
 *   "strings with different markers can't be assigned": Check.Unrelated<BrandedString<T>, BrandedString<U>>(),
 *   'is covariant': Check.With(<TSub extends T>() =>
 *      Check.AssignOneWay<BrandedString<T>, BrandedString<TSub>>(),
 *    ),
 * }));
 *
 */
export function Check(checkFn: (...args: never[]) => Valid): void;
export function Check(): void {}

class RuntimeCheckError extends Error {
  static {
    this.prototype.name = 'RuntimeCheckError';
  }

  constructor(name: string) {
    super(`\`Check.${name}\` should only be called within \`Check()\``);
  }
}

function makePairFunction<T>() {
  return (x: T, y: T) => ({ x, y });
}

Check(() => ({
  'makePairFunction return value': Check.With(<T>(x: T, y: T) => {
    const pairFn = makePairFunction<T>();
    const value = pairFn(x, y);

    return {
      'is a function': Check.Subtype<typeof pairFn, Function>(),
      'returns the expected type': Check.Equivalent<typeof value, { x: T; y: T }>(),
    };
  }),
}));

/** Type checking functions to be called within {@link Equivalent()} */
export namespace Check {
  /**
   * Wraps a type check in a function with arbitrary arguments.
   *
   * This can be used to define new type variables, simulate the existence of a value, declare new types,
   * or declare variables to reference with `typeof`.
   */
  export function With<T extends NestedResult>(checkFn: (...args: unknown[]) => T): T {
    throw new RuntimeCheckError(With.name);
  }

  /** Checks that `A` and `B` are mutually assignable. */
  export function Equivalent<A extends B, B extends _A, _ extends '...' = '...', _A = A>(
    _: DisableOverloadIfExtends<A, B>,
  ): TypeResult.Fail<[A, 'should extend', B]>;
  export function Equivalent<A extends B, B extends _A, _ extends '...' = '...', _A = A>(
    _: DisableOverloadIfExtends<B, A>,
  ): TypeResult.Fail<[B, 'should extend', A]>;
  export function Equivalent<A extends B, B extends _A, _ extends '...' = '...', _A = A>(): TypeResult.Pass;
  export function Equivalent(): never {
    throw new RuntimeCheckError(Equivalent.name);
  }

  /** Checks that `A` and `B` are the same type. */
  export function Same<A extends B, B extends _A, _ extends '...' = '...', _A = A>(
    _: DisableOverloadIfExtends<A, B>,
  ): TypeResult.Fail<[A, 'should extend', B]>;
  export function Same<A extends B, B extends _A, _ extends '...' = '...', _A = A>(
    _: DisableOverloadIfExtends<B, A>,
  ): TypeResult.Fail<[B, 'should extend', A]>;
  export function Same<A extends B, B extends _A, _ extends '...' = '...', _A = A>(): IsSameType<
    A,
    B
  > extends true ?
    TypeResult.Pass
  : TypeResult.Fail<[A, 'should be the same type as', B]>;
  export function Same(): never {
    throw new RuntimeCheckError(Same.name);
  }

  /** Checks that `A` and `B` are identical types. */
  export function SameStrict<A extends B, B extends _A, _ extends '...' = '...', _A = A>(
    _: DisableOverloadIfExtends<A, B>,
  ): TypeResult.Fail<[A, 'should extend', B]>;
  export function SameStrict<A extends B, B extends _A, _ extends '...' = '...', _A = A>(
    _: DisableOverloadIfExtends<B, A>,
  ): TypeResult.Fail<[B, 'should extend', A]>;
  export function SameStrict<
    A extends B,
    B extends _A,
    _ extends '...' = '...',
    _A = A,
  >(): IsSameTypeStrict<A, B> extends true ? TypeResult.Pass
  : TypeResult.Fail<[A, 'should be the strict same type as', B]>;
  export function SameStrict(): never {
    throw new RuntimeCheckError(SameStrict.name);
  }

  /** Checks that `Sub` is assignable to `Super`. */
  export function Subtype<Sub extends Super, Super>(
    _: DisableOverloadIfExtends<Sub, Super>,
  ): TypeResult.Fail<[Sub, 'should extend', Super]>;
  export function Subtype<Sub extends Super, Super>(): TypeResult.Pass;
  export function Subtype(): never {
    throw new RuntimeCheckError(Subtype.name);
  }

  /** Checks that `Super` is assignable from `Sub`. */
  export function Supertype<Super, Sub extends Super>(
    _: DisableOverloadIfExtends<Sub, Super>,
  ): TypeResult.Fail<[Sub, 'should extend', Super]>;
  export function Supertype<Super, Sub extends Super>(): TypeResult.Pass;
  export function Supertype(): never {
    throw new RuntimeCheckError(Supertype.name);
  }

  /**
   * Alias of {@link Supertype}.
   *
   * @reexport
   */
  export const Assign = Supertype;

  /** Checks that `A` is not assignable to `B`. */
  export function NotSubtype<A extends B, B>(): TypeResult.Fail<[A, 'should not extend', B]>;
  export function NotSubtype<A, B>(): TypeResult.Pass;
  export function NotSubtype(): never {
    throw new RuntimeCheckError(NotSubtype.name);
  }

  /** Checks that `A` is not assignable from `B`. */
  export function NotSupertype<A, B extends A>(): TypeResult.Fail<[B, 'should not extend', A]>;
  export function NotSupertype<A, B>(): TypeResult.Pass;
  export function NotSupertype(): never {
    throw new RuntimeCheckError(NotSupertype.name);
  }

  /**
   * Alias of {@link NotSupertype}.
   *
   * @reexport
   */
  export const NotAssign = NotSupertype;

  /** Checks that `Sub` is assignable to `Super` but not vice versa. */
  export function StrictSubtype<Sub, Super extends Sub>(): TypeResult.Fail<
    [Super, 'should not extend', Sub]
  >;
  export function StrictSubtype<Sub extends Super, Super>(): TypeResult.Pass;
  export function StrictSubtype(): never {
    throw new RuntimeCheckError(StrictSubtype.name);
  }

  /** Checks that `Super` is assignable from `Sub` but not vice versa. */
  export function StrictSupertype<Super extends Sub, Sub>(): TypeResult.Fail<
    [Super, 'should not extend', Sub]
  >;
  export function StrictSupertype<Super, Sub extends Super>(): TypeResult.Pass;
  export function StrictSupertype(): never {
    throw new RuntimeCheckError(StrictSupertype.name);
  }

  /**
   * Alias of {@link StrictSupertype}.
   *
   * @reexport
   */
  export const AssignOneWay = StrictSupertype;

  /** Checks that neither `A` nor `B` are assignable to the other. */
  export function Unrelated<A extends B, B>(): TypeResult.Fail<[B, 'should not extend', A]>;
  export function Unrelated<A, B extends A>(): TypeResult.Fail<[B, 'should not extend', A]>;
  export function Unrelated<A, B>(): TypeResult.Pass;
  export function Unrelated(): never {
    throw new RuntimeCheckError(Unrelated.name);
  }
}
