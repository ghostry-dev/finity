/**
 * This package's test surface: `bun:test` wrapped by `@ghostry/harness`, which
 * every test file imports instead of `bun:test` itself, the package under test,
 * imported by name so the tests run against the build, and a helper for effects
 * that run in stages.
 *
 * `vi` is re-exported as it is: harness wraps only the parts of a runner that
 * register tests and hooks.
 *
 * @module
 */

import { initialize as initializeHarness, type Attest } from "@ghostry/harness";
import { testEffect } from "@solidjs/testing-library";
import * as framework from "bun:test";
import { createEffect } from "solid-js";

const harness = initializeHarness({ framework });

export const { describe, expect, it, test } = harness;

/**
 * Annotated, because an assertion narrows only through a binding whose type is
 * written out; a destructure never qualifies (TS2775).
 */
export const attest: Attest = harness.attest;

export { vi } from "bun:test";

export { initialize } from "@ghostry/finity-solidjs";

/**
 * Runs each stage in turn, one per run of a tracking effect. A stage that
 * changes a signal the effect reads schedules the next one; the last stage
 * calls `done`.
 */
export const testEffectInStages = async (
  toStages: (done: () => void) => (() => void)[],
): Promise<void> =>
  testEffect((done) => {
    const stages = toStages(done);
    let run = 0;

    createEffect(() => {
      const stage = stages[run];
      run++;
      if (stage) stage();
    });
  });
