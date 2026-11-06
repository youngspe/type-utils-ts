/**
 * @module /helpers
 */

/**
 * Evaluates to `True` if `T` and `U` are the same type, otherwise `False`.
 */
export type IsSameType<T, U, True = true, False = false> =
  (<X>() => X extends [T, U] ? true : false) extends <X>() => X extends [U, T] ? true : false ? True
  : False;

/**
 * Evaluates to `True` if `T` and `U` are identical, otherwise `False`.
 */
export type IsSameTypeStrict<T, U, True = true, False = false> = IsSameType<
  [T, T | U],
  [T | U, U],
  True,
  False
>;

/**
 * Add a parameter with this type to an overload if the overload should be skipped when `Sub` extends `Super`.
 */
export type DisableOverloadIfExtends<Sub, Super> = [Sub] extends [Super] ? never : void;
