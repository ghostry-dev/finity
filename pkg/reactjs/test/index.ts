/**
 * This package's test surface: `bun:test` wrapped by `@ghostry/harness`, which
 * every test file imports instead of `bun:test` itself, and the package under
 * test, imported by name so the tests run against the build.
 *
 * `vi` is re-exported as it is: harness wraps only the parts of a runner that
 * register tests and hooks.
 *
 * @module
 */

import { initialize as initializeHarness, type Attest } from "@ghostry/harness";
import * as framework from "bun:test";

const harness = initializeHarness({ framework });

export const { describe, expect, it, test } = harness;

/**
 * Annotated, because an assertion narrows only through a binding whose type is
 * written out; a destructure never qualifies (TS2775).
 */
export const attest: Attest = harness.attest;

export { vi } from "bun:test";

export { initialize } from "@ghostry/finity-reactjs";
