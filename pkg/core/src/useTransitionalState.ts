import type { DefinedTransitionalState } from './defineTransitionalState';
import { InvalidTransitionError, type Reason } from './InvalidTransitionError';
import type {
  FiniteStateUnion,
  StateDefinition,
  TransitionalStateUnion,
  TransitionsDefinition,
} from './States';
import { type Config, type FundamentalState, type Getter } from './Types';
import useClock from './useClock';
import type { UseRefHook } from './useRef';
import type { UseState, UseStateHook } from './useState';
import { shallowEqual } from './Utils';

/**
 * At runtime, a state may carry a `transition` property (e.g. when spread
 * from a transitional state), which should not affect state equality.
 */
const withoutTransition = ({
  transition: _,
  ...state
}: FundamentalState & { transition?: unknown }): FundamentalState => state;

/**
 * Returns the transitional state type from a defined transitional state.
 */
export type UsingTransitionalState<
  T extends DefinedTransitionalState<any, any, any>,
> = T extends DefinedTransitionalState<infer K, infer S, infer X>
  ? UseTransitionalState<K, S, X>
  : never;

export interface UseTransitionalState<
  K extends string,
  S extends StateDefinition<K>,
  X extends TransitionsDefinition<K>,
> extends UseState<FiniteStateUnion<K, S>> {
  value(): TransitionalStateUnion<K, S, X>;
}

export type UseTransitionalStateHook = <
  K extends string,
  S extends StateDefinition<K>,
  X extends TransitionsDefinition<K>,
>(
  State: DefinedTransitionalState<K, S, X>,
  initial: NoInfer<Getter<FiniteStateUnion<K, S>>>,
) => UseTransitionalState<K, S, X>;

export default (
  config: Config,
  useState: UseStateHook,
  useRef: UseRefHook,
): UseTransitionalStateHook => {
  const isEqualState = config.isEqualState ?? shallowEqual;

  return <
    K extends string,
    S extends StateDefinition<K>,
    X extends TransitionsDefinition<K>,
  >(
    State: DefinedTransitionalState<K, S, X>,
    initial: NoInfer<Getter<FiniteStateUnion<K, S>>>,
  ): UseTransitionalState<K, S, X> => {
    type $State = FiniteStateUnion<K, S>;
    type $Use = UseTransitionalState<K, S, X>;

    type $Set = $Use['set'];
    type $Update = $Use['update'];
    type $Value = $Use['value'];

    const clock = useClock(useRef);

    /**
     * The latest state is shared by every render of a component, so that
     * transitions are checked against it. In React, the value of state is a
     * snapshot of the render that read it, which may since have been set.
     */
    const latest = useRef<$State>(initial);

    const invalidTransition = (
      reason: Reason,
      to: FundamentalState,
      boundTick: number,
    ): void => {
      config.onInvalidTransition?.(
        new InvalidTransitionError({
          reason,
          state: {
            name: State.name,
            from: latest.current,
            to,
          },
          tick: {
            current: clock.current(),
            bound: boundTick,
          },
        }),
      );
    };

    const bind = (s: $State): ReturnType<$Value> => {
      /**
       * When the transition function is created, it should be bound
       * to a particular tick of the clock, so that the transition
       * function has no effect if the state has since been updated.
       */
      const boundTick = clock.current();

      return {
        ...s,
        transition: (to: Exclude<$State, Function>): void => {
          if (clock.current() !== boundTick) {
            return invalidTransition('stale', to, boundTick);
          }

          const current = latest.current;

          if (!State.transitions[current.kind].includes(to.kind)) {
            return invalidTransition('disallowed', to, boundTick);
          }

          /**
           * Transitioning to an equal state is skipped, so that effects do
           * not rerun. The clock isn't advanced either, which leaves this
           * transition function valid since the state hasn't changed.
           */
          if (
            current.kind === to.kind &&
            isEqualState(withoutTransition(current), withoutTransition(to))
          ) {
            return;
          }

          set(to);
        },
      } as unknown as ReturnType<$Value>;
    };

    /**
     * The state is kept bound to the clock, rather than being bound whenever
     * `value` is called, so that its identity only changes when it is set.
     */
    const state = useState<ReturnType<$Value>>(() => bind(latest.current));

    const set: $Set = (value: $State): $State => {
      clock.advance();
      latest.current = value;
      state.set(bind(value));
      return value;
    };

    const update: $Update = (fn: (prev: $State) => $State): $State => {
      return set(fn(latest.current));
    };

    const value: $Value = () => {
      return state.value();
    };

    return { set, update, value };
  };
};
