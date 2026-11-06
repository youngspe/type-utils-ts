/** Evaluates to `Sub`, but requires that `Sub` extends `Super`. */
export type SoftMustExtend<Super, Sub extends Super> = Sub;

/** Evaluates to a type variable equivalent to `Sub` that is known to extend `Super`, or `never` if `Sub` does not extend `Super`. */
export type AssertExtend<Super, Sub> = SoftMustExtend<
  Super,
  [Sub] extends [infer _Sub extends Super] ? _Sub
  : Sub extends infer _Sub extends Super ? Sub
  : never
>;

/** Evaluates to a type variable equivalent to `Sub` that is known to extend `Super` */
export type MustExtend<Super, Sub extends Super> = AssertExtend<Super, Sub>
