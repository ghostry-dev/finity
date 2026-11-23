/**
 * Everything that differs between Solid 1 and Solid 2, which this package
 * supports from the same build.
 *
 * Only exports that both majors have are imported, here and in every other
 * module: a named import of one that only Solid 2 has, like `flush`, fails to
 * link on Solid 1. The source is type-checked against Solid 2, so the few calls
 * that only Solid 1 accepts are cast.
 *
 * @module
 */

import type { Getter, Setter } from "@ghostry/finity-core";
import { createEffect, createRoot, createSignal, untrack } from "solid-js";

let solid2: boolean | undefined;

/**
 * Whether the installed Solid is 2.x, found on first use.
 *
 * Solid 2 runs a function passed to `createSignal` as a computation, where
 * Solid 1 stores the function as the signal's value, so such a signal tells the
 * two apart. It's found lazily, not on import, so that importing this package
 * has no side effects.
 */
export const isSolid2 = (): boolean =>
  (solid2 ??= createRoot((dispose) => {
    const [probe] = createSignal<unknown>(() => 2);
    const found = untrack(probe) === 2;
    dispose();
    return found;
  }));

/**
 * finity's state primitive, as a signal.
 *
 * The initial value is read once, untracked. It's a seed: if a change to what
 * it read reset the signal, core's record of the latest state and its
 * transition clock wouldn't follow.
 */
export const signal = <T extends {}>(
  initial: () => T,
): [Getter<T>, Setter<T>] => {
  const value = untrack(initial);

  /**
   * Solid 2 would run a function value as a computation, so it's returned from
   * one instead, which never reruns since it reads nothing.
   */
  const [get, set] =
    typeof value === "function" && isSolid2()
      ? createSignal<T>(() => value)
      : createSignal<T>(value as Exclude<T, Function>);

  return [get, set];
};

/**
 * finity's ref primitive. A Solid component runs once, so a plain object lasts
 * as long as the component, and nothing reactive is read to set it up.
 */
export const ref = <T>(initial: () => T): { current: T } => ({
  current: untrack(initial),
});

/**
 * An effect that tracks only what `compute` reads, then runs `apply` with its
 * result, untracked.
 *
 * That's Solid 2's `createEffect`, which requires the two phases. Solid 1's
 * takes one function, which tracks everything it reads, so `apply` is untracked
 * within it to behave the same.
 */
export const effect = <T>(
  compute: () => T,
  apply: (value: T) => void,
): void => {
  if (isSolid2()) {
    createEffect(compute, (value) => {
      apply(value);
    });
  } else {
    (createEffect as unknown as (fn: () => void) => void)(() => {
      const value = compute();
      untrack(() => apply(value));
    });
  }
};
