/** @module /hkt */
import type { AssertExtend, MustExtend } from './helpers.js';

declare const outProps: unique symbol;
declare const contravariantInput: unique symbol;
declare const input: unique symbol;

/**
 * A higher-kinded type, or a type-level function.
 *
 * @example
 * import { Hkt } from '@youngspe/hkt-ts';
 *
 * interface Wrapped extends Hkt<unknown, [unknown]> {
 *   Output: [Hkt.Input<this>];
 * }
 */
export interface Hkt<in In = unknown, Out = unknown> extends Hkt.Base<In, { Output: Out }> {
  /**
   * The output of the type-level function.
   * Override this in the type definition to set the output of the HKT in terms of {@linkcode Hkt.Input | Hkt.Input<this>}
   */
  Output: Out;
}

interface Contravariant<in T> {
  _contravariant: Contravariant<T>;
}
type ContravariantType<V extends Contravariant<never>> = V extends Contravariant<infer X> ? X : never;

interface _HktBase<in In, out OutProps> {
  /** @ignore */
  readonly [contravariantInput]: Contravariant<In>;
  /** @ignore */
  readonly [outProps]: OutProps;
}

type SimplifySubtype<Sub, Super> = Super | Exclude<Sub, Super>;

export namespace Hkt {
  /**
   * An {@link Hkt}-like type; one or more output types are defined using the properties of {@link OutProps}.
   */
  export type Base<In, OutProps> = _HktBase<In, OutProps> & Readonly<OutProps>;

  type InputBase<This extends Hkt.Base<never, any>> = ContravariantType<This[typeof contravariantInput]>;

  type _Input<This extends Hkt.Base<never, any>, In = InputBase<This>> =
    typeof input extends keyof This ?
      This extends { [input]?: [infer X extends In] } ?
        X
      : In
    : In;

  /**
   * The input type parameter to an {@link Hkt}.
   *
   * @example
   * import { Hkt } from '@youngspe/hkt-ts';
   *
   * interface Stringified extends Hkt<string | number, string> {
   *   // Hkt.Input<this> is guaranteed to extend string | number, so it can be used in a template literal.
   *   Output: `${Hkt.Input<this>}`;
   * }
   */
  export type Input<This extends Hkt.Base<never, any>> = _Input<This>;

  export interface Identity<T = unknown> extends Hkt<T, T> {
    Output: Hkt.Input<this>;
  }

  /** An {@link Hkt} that always evaluates to `T`. */
  export interface Constant<T> extends Hkt<unknown, T> {
    Output: T;
  }

  type ApplyBase<H, In> = H & { [input]: [In] };

  type _ApplyProp<B, K extends PropertyKey> =
    [B] extends [Record<K, infer V extends B[K & keyof B]>] ? V : B[K & keyof B];

  /** Like {@link ApplyProp}, but does not check that `H` is ` valid `Hkt.Base<In>`. */
  export type ApplyPropUnchecked<H, K extends PropertyKey, In> = _ApplyProp<ApplyBase<H, In>, K>;

  /** Gets an output property type of an {@link Hkt.Base} for the given input type. */
  export type ApplyProp<
    H extends Hkt.Base<In, Record<K, any>>,
    K extends PropertyKey,
    In,
  > = Hkt.ApplyPropUnchecked<H, K, In>;

  /** Like {@link Apply}, but does not check that `H` is ` valid `Hkt<In>`. */
  export type ApplyUnchecked<H, In> = ApplyPropUnchecked<H, 'Output', In>;

  /** Gets the output type of an {@link Hkt} for the given input type. */
  export type Apply<H extends Hkt<In, any>, In> = ApplyUnchecked<H, In>;

  /** Gets a placeholder output property type for an arbitrary input type. */
  export type ApplyUnknownProp<
    H extends Hkt.Base<In, Record<K, any>>,
    K extends PropertyKey,
    In = Hkt.Input<H>,
  > = Extract<SimplifySubtype<Hkt.ApplyProp<H, K, never>, Hkt.ApplyProp<H, K, In>>, DeclaredOutput<H, K>>;

  /**
   * Gets a placeholder output type for an arbitrary input type.
   */
  export type ApplyUnknown<H extends Hkt<In, any>, In = Hkt.Input<H>> = ApplyUnknownProp<H, 'Output', In>;

  /** Gets the output property types of an {@link Hkt.Base} for the given input type. */
  export type ApplyProps<H extends Hkt.Base<In, any>, In> = {
    [K in keyof H[typeof outProps]]: ApplyProp<H, K, In>;
  };

  /** Gets placeholder output property types for an arbitrary input type. */
  export type ApplyUnknownProps<H extends Hkt.Base<In, any>, In = Hkt.Input<H>> = {
    [K in keyof H[typeof outProps]]: ApplyUnknownProp<H, K, In>;
  };

  /** The declared base types for the output properties of `H`. */
  export type DeclaredProps<H extends Hkt.Base<never, any>> = H[typeof outProps];

  /** The declared base type for the output of `H`. */
  export type DeclaredOutput<
    H extends Hkt.Base<never, Record<K, any>>,
    K extends PropertyKey = 'Output',
  > = DeclaredProps<H>[K];

  /**
   * Composition of two {@link Hkt}s `F` and `G`.
   *
   * Applies `F` to the output of `G`.
   */
  export interface Compose<
    F extends Hkt<Mid>,
    G extends Hkt<In, Mid>,
    In = Hkt.Input<G>,
    Mid = Hkt.ApplyUnknown<G>,
  > extends Hkt<In, Hkt.Apply<F, Mid>> {
    Output: Hkt.Apply<F, Hkt.Apply<G, Hkt.Input<this>>>;
  }

  /** Like {@link ApplyNested}, but does not check that `H` is a valid `Hkt.Nested<In>`. */
  export type ApplyNestedUnchecked<H, In extends unknown[]> =
    In extends [] ? H
    : In extends [infer A, ...infer B] ? Hkt.ApplyNestedUnchecked<Hkt.ApplyUnchecked<H, A>, B>
    : never;

  /**
   * Recursively applies the HKT for once for each item in `In`.
   *
   * For example, `Hkt.ApplyNested<H, [A, B, C]>` is equivalent to `Hkt.Apply<Hkt.Apply<Hkt.Apply<H, A>, B>, C>`.
   */
  export type ApplyNested<H extends Hkt.Nested<In>, In extends unknown[]> = ApplyNestedUnchecked<H, In>;

  /**
   * If `In` is not empty, a base type for an HKT that recursively evaluates to HKTs at a depth of `In['length']`.
   * If `In` is empty, equivalent to `Out`.
   */
  export type Nested<In extends unknown[], Out = unknown> =
    In extends [] ? Out
    : In extends [infer A, ...infer B] ? Hkt<A, Hkt.Nested<B, Out>>
    : Out | Hkt<In[number], Hkt.Nested<In, Out>>;
}

/**
 * Evaluates to an HKT that composes with `F`.
 */
export interface CompositionHkt<F extends Hkt<Mid>, In = unknown, Mid = Hkt.Input<F>> extends Hkt<
  Hkt<In, Mid>,
  Hkt<In, Hkt.Apply<F, Mid>>
> {
  Output: Hkt.Compose<F, Hkt.Input<this>, In, Mid>;
}

/**
 * Evaluates to an HKT that composes `F`.
 */
export interface CompositionOverHkt<
  G extends Hkt<In, Mid>,
  Out = unknown,
  In = Hkt.Input<G>,
  Mid = Hkt.ApplyUnknown<G>,
> extends Hkt<Hkt<Mid, Out>, Hkt<In, Out>> {
  Output: Hkt.Compose<Hkt.Input<this>, G, In, Mid>;
}

/** An {@link Hkt} of `X => readonly X[]`. */
export interface ReadonlyArrayHkt<T = unknown> extends Hkt<T, readonly T[]> {
  Output: readonly Hkt.Input<this>[];
}

/** An {@link Hkt} of `X => X[]`. */
export interface ArrayHkt<T = unknown> extends Hkt<T, T[]> {
  Output: Hkt.Input<this>[];
}

/** An {@link Hkt} of `X => Promise<X>`. */
export interface PromiseHkt<T = unknown> extends Hkt<T, Promise<T>> {
  Output: Promise<Hkt.Input<this>>;
}

/** An {@link Hkt} of `X => A[X]`. */
export interface PropertyHkt<A, K extends keyof A = keyof A> extends Hkt<K, A[K]> {
  Output: A[K];
}

type _AsNestedHkt<H, Items extends unknown[], Out, Pre extends unknown[]> = AssertExtend<
  Hkt.Nested<Items, Out>,
  Items extends [] ? Hkt.ApplyUnchecked<H, Pre>
  : Items extends [infer A, ...infer B] ? _AsNestedHkt_NonEmpty<H, A, B, Out, Pre>
  : never
>;

interface _AsNestedHkt_NonEmpty<H, First, Rest extends unknown[], Out, Pre extends unknown[]> extends Hkt<
  First,
  Hkt.Nested<Rest, Out>
> {
  Output: _AsNestedHkt<H, Rest, Out, [...Pre, Hkt.Input<this>]>;
}

/**
 * Converts an HKT that accepts a tuple `In` into a nested HKT of depth `In['length']`.
 * The resulting HKT will extend {@linkcode Hkt.Nested | Hkt.Nested<In, Out>}.
 */
export type AsNestedHkt<
  H extends Hkt<In, Out>,
  In extends unknown[] = Hkt.Input<H>,
  Out = Hkt.DeclaredOutput<H>,
> = MustExtend<Hkt.Nested<In, Out>, _AsNestedHkt<H, In, Out, []>>;
