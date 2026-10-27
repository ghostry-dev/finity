import {
  ExhaustiveSwitchInstance,
  type ExhaustiveSwitch,
  type Getter,
} from '@ghostry/finity-core';
import * as React from 'react';
import type { Config } from './Types';

type RenderSwitch<
  S extends { kind: string },
  C extends S['kind'],
> = ExhaustiveSwitch<React.ReactNode, S, C>;

class RenderSwitchInstance<
  S extends { kind: string },
> extends ExhaustiveSwitchInstance<React.ReactNode, S> {
  public use = (): React.ReactNode => {
    const s = this.state();
    /**
     * The case is found on every render, rather than memoized on the state,
     * so that the case function of the current render is used. Memoizing it
     * would keep a previous render's function, along with the stale values
     * that it closes over.
     */
    const found = this.cases.find(([kinds, _]) => kinds.includes(s.kind));
    if (found) {
      const [_, render] = found;
      return render(s);
    } else {
      throw new Error('[finity] Invalid state switch!');
    }
  };
}

export default (_config: Config) =>
  <S extends { kind: string }>(state: Getter<S>): RenderSwitch<S, never> => {
    return new RenderSwitchInstance(state, []) as unknown as RenderSwitch<
      S,
      never
    >;
  };
