import {
  ExhaustiveSwitchInstance,
  type ExhaustiveSwitch,
} from "./ExhaustiveSwitch.ts";
import type { Config, Getter } from "./Types.ts";

export type EffectSwitch<
  S extends { kind: string },
  C extends S["kind"],
> = ExhaustiveSwitch<void, S, C>;

export default (_config: Config) =>
  <S extends { kind: string }>(state: Getter<S>): EffectSwitch<S, never> => {
    return new ExhaustiveSwitchInstance<void, S>(
      state,
      [],
    ) as unknown as EffectSwitch<S, never>;
  };
