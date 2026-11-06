import type { Hkt } from './hkt.js';

/**
 * A specialized type for `WeakMap` where the key and value types are determined by HKTs.
 *
 * @example
 * import type { Hkt } from '@youngspe/hkt-ts';
 * import { type TypedWeakMap, makeTypedWeakMap } from '@youngspe/hkt-ts/typedMap';
 *
 * type Constructor<T = unknown> =
 *   (abstract new (...args: any[]) => T) | ((...args: any[]) => T) | { prototype: T };
 *
 * interface ConstructorHkt extends Hkt<unknown, Constructor> {
 *   Output: Constructor<Hkt.Input<this>>;
 * }
 *
 * export type DependencyContainer = TypedWeakMap<ConstructorHkt>;
 * export const makeDependencyContainer = (): DependencyContainer => makeTypedWeakMap();
 * class FooManager { private _: unknown }
 * class FooClient { private _: unknown }
 *
 * const container = makeDependencyContainer();
 *
 * container.set(FooManager, new FooManager());
 * container.set(FooClient, new FooClient());
 *
 * // container.set(FooClient, new FooManager());
 * // ^ Error: Argument of type 'FooManager' is not assignable to parameter of type 'FooClient'.
 */
export interface TypedWeakMap<
  K extends Hkt<In, WeakKey>,
  V extends Hkt<In> = Hkt.Identity,
  In = unknown,
> extends Omit<WeakMap<Hkt.Apply<K, In>, Hkt.Apply<V, In>>, 'get' | 'set' | 'delete' | 'has'> {
  get<T extends In>(key: Hkt.Apply<K, T>): Hkt.Apply<V, T> | undefined;
  set<T extends In>(key: Hkt.Apply<K, T>, value: Hkt.Apply<V, T>): void;
  has<T extends In>(key: Hkt.Apply<K, T>): boolean;
  delete<T extends In>(key: Hkt.Apply<K, T>): boolean;
}

/**
 * A specialized type for `Map` where the key and value types are determined by HKTs.
 *
 *
 * @example
 * import type { Hkt } from '@youngspe/hkt-ts';
 * import { type TypedMap, makeTypedMap } from '@youngspe/hkt-ts/typedMap';
 *
 * type Constructor<T = unknown> =
 *   (abstract new (...args: any[]) => T) | ((...args: any[]) => T) | { prototype: T };
 *
 * interface ConstructorHkt extends Hkt<unknown, Constructor> {
 *   Output: Constructor<Hkt.Input<this>>;
 * }
 *
 * export type DependencyContainer = TypedMap<ConstructorHkt>;
 * export const makeDependencyContainer = (): DependencyContainer => makeTypedMap();
 * class FooManager { private _: unknown }
 * class FooClient { private _: unknown }
 *
 * const container = makeDependencyContainer();
 *
 * container.set(FooManager, new FooManager());
 * container.set(FooClient, new FooClient());
 *
 * // container.set(FooClient, new FooManager());
 * // ^ Error: Argument of type 'FooManager' is not assignable to parameter of type 'FooClient'.
 */
export interface TypedMap<K extends Hkt<In>, V extends Hkt<In> = Hkt.Identity, In = unknown> extends Omit<
  Map<Hkt.Apply<K, In>, Hkt.Apply<V, In>>,
  'get' | 'set' | 'has' | 'delete' | 'forEach'
> {
  get<T extends In>(key: Hkt.Apply<K, T>): Hkt.Apply<V, T> | undefined;
  set<T extends In>(key: Hkt.Apply<K, T>, value: NoInfer<Hkt.Apply<V, T>>): void;
  has<T extends In>(key: Hkt.Apply<K, T>): boolean;
  delete<T extends In>(key: Hkt.Apply<K, T>): boolean;
  forEach(f: <T extends In>(key: Hkt.Apply<K, T>, value: Hkt.Apply<V, T>, map: this) => void): void;
}

/** Instantiates a {@link TypedWeakMap}. */
export const makeTypedWeakMap = <
  K extends Hkt<In, WeakKey>,
  V extends Hkt<In> = Hkt.Identity,
  In = unknown,
>() => new WeakMap<any, any>() as TypedWeakMap<K, V, In>;

/** Instantiates a {@link TypedMap}. */
export const makeTypedMap = <K extends Hkt<In>, V extends Hkt<In> = Hkt.Identity, In = unknown>() =>
  new Map<any, any>() as TypedMap<K, V, In>;
