/**
 * This package's test surface: `bun:test` wrapped by `@ghostry/harness`, which
 * every test file imports instead of `bun:test` itself.
 *
 * finity-core's behavior is tested through the framework packages, which supply
 * the state primitive it needs. Its own tests cover what it defines alone.
 *
 * @module
 */

import { initialize, type Attest } from "@ghostry/harness";
import * as framework from "bun:test";

const harness = initialize({ framework });

export const { describe, expect, it, test } = harness;

/**
 * Annotated, because an assertion narrows only through a binding whose type is
 * written out; a destructure never qualifies (TS2775).
 */
export const attest: Attest = harness.attest;
