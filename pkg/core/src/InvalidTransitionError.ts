import type { FundamentalState } from './Types.ts';

interface StateInfo {
  name: string | undefined;
  from: FundamentalState;
  to: FundamentalState;
}

interface ClockTickInfo {
  current: number;
  bound: number;
}

export type Reason = 'stale' | 'disallowed';

interface InvalidTransitionContext {
  reason: Reason;
  state: StateInfo;
  tick: ClockTickInfo;
}

/**
 * An `Error` type that provides information about a state transition that
 * was rejected.
 */
export class InvalidTransitionError extends Error {
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
      reason === 'stale'
        ? `because the transition should have occurred at tick ${tick.bound} ` +
          `but other state changes have advanced the tick to ${tick.current}`
        : ``,
    ].join(' ');

    super(message);

    this.reason = reason;
    this.state = state;
    this.tick = tick;
  }
}
