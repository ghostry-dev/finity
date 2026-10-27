import type { UseRefHook } from './useRef';

interface UseClock {
  current: () => number;
  advance: () => number;
}

export default (useRef: UseRefHook): UseClock => {
  /**
   * The tick is shared by every render of a component, so that a transition
   * function becomes stale when the state is changed by any render's
   * functions, rather than only by those of the render that created it.
   */
  const tick = useRef(() => 0);

  return {
    current: () => {
      return tick.current;
    },
    advance: () => {
      return ++tick.current;
    },
  };
};
