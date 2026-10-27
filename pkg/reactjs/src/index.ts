import * as Core from '@ghostry/finity-core';
import * as React from 'react';
import type { Config } from './Types.ts';
import $useEffect from './useEffect.ts';
import $useRender from './useRender.ts';

export type {
  Config,
  ExhaustiveSwitch,
  ExhaustiveSwitchInstance,
  Getter,
  InvalidTransitionError,
  Setter,
  TransitionalState,
  TransitionalStates,
  UsingStrictlyTransitionalState,
  UsingTransitionalState,
} from '@ghostry/finity-core';

/**
 * Initialization of the library returns these set of functions.
 */
export interface Initialized extends Core.Initialized {
  /**
   * A component hook to render JSX based on the current state.
   */
  useRender: ReturnType<typeof $useRender>;
}

/**
 * Initializes an instance of the usable library API for ReactJS according
 * to the provided configuration.
 */
export const initialize = (config: Config): Initialized => {
  const api = Core.initialize({
    ...config,
    useState: <T extends {}>(initial: () => T) => {
      const [value, set] = React.useState(initial);

      const getter: Core.Getter<T> = () => value;
      const setter: Core.Setter<T> = <U extends T>(value: U) => {
        if (typeof value === 'function') {
          let result = getter();
          set((prev) => {
            result = value(prev);
            return result;
          });
          return result;
        } else {
          set(value);
          return value;
        }
      };

      return [getter, setter];
    },
  });

  const useEffect = $useEffect(config);
  const useRender = $useRender(config);

  return {
    ...api,
    useEffect,
    useRender,
  };
};
