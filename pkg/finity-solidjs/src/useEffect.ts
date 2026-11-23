import {
  ExhaustiveSwitchInstance,
  FinityError,
  type ExhaustiveSwitch,
  type Getter,
} from "@ghostry/finity-core";
import { effect } from "./Solid.ts";
import type { Config } from "./Types.ts";

type EffectSwitch<
  S extends { kind: string },
  C extends S["kind"],
> = ExhaustiveSwitch<void, S, C>;

class EffectSwitchInstance<
  S extends { kind: string },
> extends ExhaustiveSwitchInstance<void, S> {
  /**
   * Only the state is tracked, so a case runs once per state, not again when
   * something else it reads changes.
   */
  public use = (): void => {
    effect(this.state, (s) => {
      const found = this.cases.find(([kinds, _]) => kinds.includes(s.kind));
      if (found) {
        const [_, effect] = found;
        effect(s);
      } else {
        throw new FinityError.UnhandledStateError(s.kind);
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
