import {
  ExhaustiveSwitchInstance,
  type ExhaustiveSwitch,
  type Getter,
} from "@ghostry/finity-core";
import * as React from "react";
import type { Config } from "./Types.ts";

type EffectSwitch<
  S extends { kind: string },
  C extends S["kind"],
> = ExhaustiveSwitch<void, S, C>;

class EffectSwitchInstance<
  S extends { kind: string },
> extends ExhaustiveSwitchInstance<void, S> {
  public use = (): void => {
    React.useEffect(() => {
      const s = this.state();
      const found = this.cases.find(([kinds, _]) => kinds.includes(s.kind));
      if (found) {
        const [_, effect] = found;
        effect(s);
      }
    }, [this.state()]);
  };
}

export default (_config: Config) =>
  <S extends { kind: string }>(state: Getter<S>): EffectSwitch<S, never> => {
    return new EffectSwitchInstance(state, []) as unknown as EffectSwitch<
      S,
      never
    >;
  };
