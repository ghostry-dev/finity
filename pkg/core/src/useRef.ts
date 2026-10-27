import type { UseStateHook } from './useState';

export interface UseRef<T> {
  current: T;
}

export type UseRefHook = <T>(initial: () => T) => UseRef<T>;

/**
 * A mutable value that is shared by every render of a component.
 *
 * It is built on the native state primitive: the state is never set, so its
 * value is always the same object, whose `current` property can be mutated
 * without causing a render.
 */
export default (useState: UseStateHook): UseRefHook => {
  return <T>(initial: () => T): UseRef<T> =>
    useState<UseRef<T>>(() => ({ current: initial() })).value();
};
