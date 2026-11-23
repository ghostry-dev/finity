import { FinityError, type Getter } from "@ghostry/finity-core";
import { createMemo, untrack, type Component } from "solid-js";

/**
 * What a component renders: `JSX.Element` in Solid 1, `Element` in Solid 2.
 * Neither major exports the other's name, but both type a component's result.
 */
export type SolidElement = ReturnType<Component>;

/**
 * What a case may render. A function is rendered reactively, so that a case can
 * read the state without JSX, e.g. `(s) => () => s.kind`.
 */
export type CaseElement = SolidElement | (() => SolidElement);

/**
 * The state as seen by a case: its properties read the latest state while it is
 * handled by the case, so that a transition within the case updates the
 * rendered elements instead of rendering the case again. Once the state is no
 * longer handled by the case, its properties keep their last values, so that a
 * late transition is rejected as stale.
 */
const live = <S extends { kind: string }>(
  state: Getter<S>,
  kinds: string[],
): S => {
  /**
   * One argument only: the second is the initial value in Solid 1, and options
   * in Solid 2. The first run has no previous state, and the state then is
   * always one of `kinds`, since the case was chosen for it.
   */
  const current = createMemo<S>((prev) => {
    const s = state();
    return !prev || kinds.includes(s.kind) ? s : prev;
  });

  return new Proxy({} as S, {
    get: (_, key) => Reflect.get(current(), key),
    has: (_, key) => Reflect.has(current(), key),
    ownKeys: () => Reflect.ownKeys(current()),
    getOwnPropertyDescriptor: (_, key) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(current(), key);
      return descriptor && { ...descriptor, configurable: true };
    },
  });
};

/**
 * Renders the case for the state's kind. Only a change of case renders a case
 * again, which disposes what the previous one created.
 */
export const render = <S extends { kind: string }>(
  state: Getter<S>,
  cases: [string[], (state: S) => CaseElement][],
): SolidElement => {
  const selected = createMemo(() => {
    const { kind } = state();
    const index = cases.findIndex(([kinds]) => kinds.includes(kind));
    if (index < 0) throw new FinityError.UnhandledStateError(kind);
    return index;
  });

  const rendered = createMemo(() => {
    const [kinds, renderCase] = cases[selected()]!;

    /**
     * A case runs once, like a component, so it's untracked. The label makes
     * Solid 2's development build warn about a read at the top of a case, as it
     * does in a component, since such a read never updates. Solid 1 ignores
     * it.
     */
    return untrack(
      () => renderCase(live(state, kinds)),
      "a finity useRender case",
    );
  });

  /**
   * A memo is a reactive child: the renderer inserts its value and follows its
   * changes, as it does for Solid's own `Show`. It's still a function, which
   * the element type excludes, hence the cast.
   */
  return rendered as unknown as SolidElement;
};
