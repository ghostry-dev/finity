import {
  defineTransitionalState,
  type DefinedTransitionalState,
} from './defineTransitionalState.ts';
import type {
  TransitionalStateByKind as $TransitionalStateByKind,
  TransitionalStateUnion as $TransitionalStateUnion,
} from './States.ts';
import type { Config, Prettify } from './Types.ts';
import $useEffect from './useEffect.ts';
import $useRef from './useRef.ts';
import $useState from './useState.ts';
import $useStrictlyTransitionalState from './useStrictlyTransitionalState.ts';
import $useTransitionalState from './useTransitionalState.ts';

export { never, noop, shallowEqual } from './Utils.ts';

export type { Config, Getter, Setter } from './Types.ts';

export { InvalidTransitionError } from './InvalidTransitionError.ts';

export {
  ExhaustiveSwitchInstance,
  type ExhaustiveSwitch,
} from './ExhaustiveSwitch.ts';

export type { UsingTransitionalState } from './useTransitionalState.ts';

export type { UsingStrictlyTransitionalState } from './useStrictlyTransitionalState.ts';

/**
 * A type union of the defined transitional states.
 */
export type TransitionalState<
  T extends DefinedTransitionalState<any, any, any>,
> = T extends DefinedTransitionalState<infer K, infer S, infer X>
  ? Prettify<$TransitionalStateUnion<K, S, X>>
  : never;

/**
 * A key-value map of each transitional state by `kind`.
 */
export type TransitionalStates<
  T extends DefinedTransitionalState<any, any, any>,
> = T extends DefinedTransitionalState<infer K, infer S, infer X>
  ? Prettify<$TransitionalStateByKind<K, S, X>>
  : never;

/**
 * Initialization of the library returns these set of functions.
 */
export interface Initialized {
  /**
   * Defines a transition state.
   */
  defineTransitionalState: typeof defineTransitionalState;

  /**
   * A component hook that standardizes use of the underlying state library.
   */
  useState: ReturnType<typeof $useState>;

  /**
   * A component hook to materially use a defined transitional state.
   * The state can then be transitioned, but can also be explicitly updated
   * without necessarily performing a valid transition.
   */
  useTransitionalState: ReturnType<typeof $useTransitionalState>;

  /**
   * A component hook to matterially use a defined transitional state.
   * The state can only be changed by performing a valid transition.
   */
  useStrictlyTransitionalState: ReturnType<
    typeof $useStrictlyTransitionalState
  >;

  /**
   * A component hook to perform an effect when the state is changed.
   */
  useEffect: ReturnType<typeof $useEffect>;
}

/**
 * Initializes an instance of the usable library API according to the
 * provided configuration.
 */
export const initialize = (config: Config): Initialized => {
  const useState = $useState(config);
  const useRef = $useRef(useState);
  const useTransitionalState = $useTransitionalState(
    config,
    useState,
    useRef,
  );
  const useStrictlyTransitionalState = $useStrictlyTransitionalState(
    config,
    useTransitionalState,
  );
  const useEffect = $useEffect(config);

  return {
    defineTransitionalState,
    useState,
    useTransitionalState,
    useStrictlyTransitionalState,
    useEffect,
  };
};
