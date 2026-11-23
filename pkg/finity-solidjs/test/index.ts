/**
 * This package's test surface: `bun:test` wrapped by `@ghostry/harness`, which
 * every test file imports instead of `bun:test` itself, the package under test,
 * imported by name so the tests run against the build, and helpers that hide
 * the differences between Solid 1 and Solid 2, which the suite runs against in
 * turn (see `setup.ts`).
 *
 * `vi` and `spyOn` are re-exported as they are: harness wraps only the parts of
 * a runner that register tests and hooks.
 *
 * @module
 */

import { initialize as initializeHarness, type Attest } from "@ghostry/harness";
import * as framework from "bun:test";
import * as Solid from "solid-js";

const harness = initializeHarness({ framework });

export const { describe, expect, it, test } = harness;

/**
 * Annotated, because an assertion narrows only through a binding whose type is
 * written out; a destructure never qualifies (TS2775).
 */
export const attest: Attest = harness.attest;

export { spyOn, vi } from "bun:test";

export { initialize } from "@ghostry/finity-solidjs";

/**
 * Each major's own APIs. They're read from the namespace, since a named import
 * of an export the running major lacks would fail to link.
 */
const solid = Solid as unknown as {
  flush?: () => void;
  onSettled?: (fn: () => void) => void;
  onMount?: (fn: () => void) => void;
  createComputed?: (fn: () => void) => void;
  resetErrorHalt?: () => void;
};

export const isSolid2: boolean = typeof solid.flush === "function";

/**
 * Applies pending writes, and runs the effects they cause. Solid 2 queues them
 * until it flushes, where Solid 1 applies them as they're made.
 */
export const settle = (): void => {
  solid.flush?.();
};

/**
 * Lets Solid run again after an error that no boundary caught. Solid 2 halts
 * its reactive system on one, and Solid 1 doesn't.
 */
export const resume = (): void => {
  solid.resetErrorHalt?.();
};

/**
 * Runs `fn` once the component is in place: `onSettled` in Solid 2, `onMount`
 * in Solid 1.
 */
export const onMounted = (fn: () => void): void => {
  // A block, since Solid 2 takes what the callback returns as its cleanup.
  (solid.onSettled ?? solid.onMount)!(() => {
    fn();
  });
};

/**
 * Calls `onChange` once, and again each time `read` reads something that has
 * changed. Solid 2 runs it after the next `settle()`; Solid 1 at once.
 */
export const watch = (read: () => unknown, onChange: () => void): void => {
  if (isSolid2) {
    // A block, since Solid 2 takes what the effect returns as its cleanup.
    Solid.createEffect(read, () => {
      onChange();
    });
  } else {
    solid.createComputed!(() => {
      read();
      Solid.untrack(onChange);
    });
  }
};
