/**
 * Every error finity throws is a subclass of {@link FinityError}, declared in
 * its namespace (`FinityError.InvalidTransitionError`): `instanceof
 * FinityError` catches everything the library raises.
 *
 * A `name` is the package and the class,
 * `"@ghostry/finity-core:InvalidTransitionError"`, so it identifies an error
 * where `instanceof` cannot: across two installed copies of this package, or
 * after the error is serialized. The framework packages re-export finity-core's
 * errors rather than defining their own, so every name starts with
 * `@ghostry/finity-core`.
 *
 * @module
 */

import type { FundamentalState } from "./Types.ts";

interface StateInfo {
  name: string | undefined;
  from: FundamentalState;
  to: FundamentalState;
}

interface ClockTickInfo {
  current: number;
  bound: number;
}

export type Reason = "stale" | "disallowed";

interface InvalidTransitionContext {
  reason: Reason;
  state: StateInfo;
  tick: ClockTickInfo;
}

/**
 * Base error class from which more specific errors inherit.
 */
export abstract class FinityError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "@ghostry/finity-core:FinityError";
  }
}

export namespace FinityError {
  /**
   * An `Error` type that provides information about a state transition that was
   * rejected.
   */
  export class InvalidTransitionError extends FinityError {
    /** The reason for rejecting the state transition. */
    public readonly reason: Reason;

    /** Information about the state for the attempted transition. */
    public readonly state: StateInfo;

    /**
     * Information about the internal monotonic clock for each instance of state
     * that is used to detect stale transitions.
     */
    public readonly tick: ClockTickInfo;

    constructor({ reason, state, tick }: InvalidTransitionContext) {
      const message = [
        `[finity] Invalid (${reason}) state transition`,
        state.name ? `of "${state.name}"` : ``,
        `from "${state.from.kind}"`,
        `to "${state.to.kind}"`,
        reason === "stale"
          ? `because the transition should have occurred at tick ${tick.bound} `
            + `but other state changes have advanced the tick to ${tick.current}`
          : ``,
      ].join(" ");

      super(message);

      this.name = "@ghostry/finity-core:InvalidTransitionError";
      this.reason = reason;
      this.state = state;
      this.tick = tick;
    }
  }

  /**
   * An `Error` thrown by a switch's `use`, like `useEffect` or `useRender`,
   * when no case handles the state's `kind`.
   *
   * A switch's types require a case for every kind, so this only happens to a
   * state that came from outside them: a cast, untyped code, or a `kind` its
   * definition doesn't declare.
   */
  export class UnhandledStateError extends FinityError {
    constructor(
      /** The `kind` of the state that no case handles. */
      public readonly kind: string,
    ) {
      super(`[finity] No case handles the state's kind "${kind}"`);
      this.name = "@ghostry/finity-core:UnhandledStateError";
    }
  }
}
