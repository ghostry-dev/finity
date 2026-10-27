import type { InvalidTransitionError } from './InvalidTransitionError';

/**
 * Represents the common structure of state types for this library.
 *
 * @private
 */
export interface FundamentalState {
  kind: string;
}

/**
 * Used as a descriptive type error when an exhaustive switch lacks cases
 * to handle all states.
 *
 * @private
 */
export interface UnhandledStates<_Unhandled> {
  _: never;
}

/**
 * A function that returns a `T` type.
 */
export type Getter<T extends {}> = {
  (): T;
};

/**
 * A function that sets a `T` type.
 */
export type Setter<T extends {}> = {
  <U extends T>(value: (prev: T) => U): U;
  <U extends T>(value: Exclude<U, Function>): U;
};

/**
 * The initial state value as a value or a `Getter`.
 */
export type InitialValue<T extends {}> = Exclude<T, Function> | Getter<T>;

/**
 * Configuration options to be provided on library initialization.
 */
export interface Config {
  /**
   * Defines the hook for native state management, typically of a frontend
   * framework.
   *
   * @protected
   */
  useState: <T extends {}>(initial: () => T) => [Getter<T>, Setter<T>];

  /**
   * A function to be invoked in the event of an invalid state transition.
   */
  onInvalidTransition?: (error: InvalidTransitionError) => void;

  /**
   * Determines whether the state being transitioned to is equal to the
   * current state, in which case the transition is skipped: the state is not
   * updated, so dependent effects and renders do not rerun.
   *
   * Only called when both states have the same `kind`. The `transition`
   * property is omitted from both states before they are compared.
   *
   * Defaults to `shallowEqual`.
   */
  isEqualState?: (a: FundamentalState, b: FundamentalState) => boolean;
}

/**
 * A utility type used to ensure a tuple does not contain duplicate items.
 *
 * @see https://stackoverflow.com/a/69386479/1454953
 *
 * @private
 */
export type IsUnique<T extends readonly unknown[]> = T extends readonly [
  infer First,
  ...infer Rest,
]
  ? First extends Rest[number]
    ? false
    : IsUnique<Rest>
  : true;

/**
 * Prettifies a type for better readability by users.
 *
 * @private
 */
export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};
