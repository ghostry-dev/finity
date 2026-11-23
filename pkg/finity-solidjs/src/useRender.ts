import {
  ExhaustiveSwitchInstance,
  type ExhaustiveSwitch,
  type Getter,
} from "@ghostry/finity-core";
import { render, type CaseElement, type SolidElement } from "./Render.ts";
import type { Config } from "./Types.ts";

type RenderSwitch<
  S extends { kind: string },
  C extends S["kind"],
> = ExhaustiveSwitch<SolidElement, S, C, CaseElement>;

class RenderSwitchInstance<
  S extends { kind: string },
> extends ExhaustiveSwitchInstance<CaseElement, S> {
  public use = (): SolidElement => {
    return render(this.state, this.cases);
  };
}

export default (_config: Config) =>
  <S extends { kind: string }>(state: Getter<S>): RenderSwitch<S, never> => {
    return new RenderSwitchInstance(state, []) as unknown as RenderSwitch<
      S,
      never
    >;
  };
