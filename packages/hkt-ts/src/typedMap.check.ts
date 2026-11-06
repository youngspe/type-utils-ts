import { Check } from '@youngspe/type-check';

import type { Hkt } from './hkt.js';
import type { TypedMap } from './typedMap.js';

interface ExampleHkt1 extends Hkt {
  Output: ['foo', Hkt.Input<this>];
}
interface ExampleHkt2 extends Hkt {
  Output: ['bar', Hkt.Input<this>];
}

Check(<T>(map: TypedMap<ExampleHkt1, ExampleHkt2>, input: T) => {
  const value = map.get<T>(['foo', input]);

  return Check.Same<typeof value, ['bar', T] | undefined>();
});
