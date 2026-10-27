/**
 * https://github.com/solidjs/solid/discussions/1527
 */

import type { Getter } from '@ghostry/finity-core';
import { createMemo, For, Match, Switch, untrack, type JSX } from 'solid-js';

/**
 * What a case may render. A function is rendered reactively, so that a case
 * can read the state without JSX, e.g. `(s) => () => s.kind`.
 */
export type CaseElement = JSX.Element | (() => JSX.Element);

/**
 * The state as seen by a case: its properties read the latest state while it
 * is handled by the case, so that a transition within the case updates the
 * rendered elements instead of rendering the case again. Once the state is
 * no longer handled by the case, its properties keep their last values, so
 * that a late transition is rejected as stale.
 */
const live = <S extends { kind: string }>(
  state: Getter<S>,
  kinds: string[],
): S => {
  const current = createMemo<S>((prev) => {
    const s = state();
    return kinds.includes(s.kind) ? s : prev;
  }, untrack(state));

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

export function Render<S extends { kind: string }>(props: {
  state: Getter<S>;
  cases: [string[], (state: S) => CaseElement][];
}): JSX.Element {
  return (
    <Switch>
      <For each={props.cases}>
        {([kinds, render]) => (
          <Match
            when={kinds.includes(props.state().kind)}
            /**
             * The children of the matching case are read in a tracked
             * scope, which is only rerun when a different case matches.
             * Rendering the case untracked keeps it from rerunning every
             * time the state changes.
             *
             * A function that the case returns is rendered reactively,
             * like any function child, though `JSX.Element` excludes it,
             * so the typecast is necessary.
             */
            children={
              untrack(() => render(live(props.state, kinds))) as JSX.Element
            }
          />
        )}
      </For>
    </Switch>
  );
}
