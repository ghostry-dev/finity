import {
  ExhaustiveSwitchInstance,
  type ExhaustiveSwitch,
  type Getter,
} from '@ghostry/finity-core';
import { createEffect } from 'solid-js';
import type { Config } from './Types.ts';

type EffectSwitch<
  S extends { kind: string },
  C extends S['kind'],
> = ExhaustiveSwitch<void, S, C>;

class EffectSwitchInstance<
  S extends { kind: string },
> extends ExhaustiveSwitchInstance<void, S> {
  public use = (): void => {
    createEffect(() => {
      const s = this.state();
      const found = this.cases.find(([kinds, _]) => kinds.includes(s.kind));
      if (found) {
        const [_, effect] = found;
        effect(s);
      } else {
        throw new Error('[finity] Invalid state switch!');
      }
    });
  };
}

export default (_config: Config) =>
  <S extends { kind: string }>(state: Getter<S>): EffectSwitch<S, never> => {
    return new EffectSwitchInstance(state, []) as unknown as EffectSwitch<
      S,
      never
    >;
  };
