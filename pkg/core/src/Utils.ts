/**
 * Useful to communicate the intent to do nothing in a callback.
 */
export const noop = (): void => {};

/**
 * Useful in the `default` case of a native `switch` that returns `void` to
 * ensure that the switch has exhausted all possible states.
 *
 * @example
 * ```ts
 * switch (foo) {
 *   case 'bar':
 *     break;
 *   case 'baz':
 *     break;
 *   default:
 *     never(foo);
 * }
 * ```
 */
export const never = (never: never): never => {
  throw new Error('Impossible code branch reached!', never);
};

/**
 * Compares two objects by their own enumerable properties, using `Object.is`
 * for each value.
 *
 * This is the default for the `isEqualState` configuration option.
 */
export const shallowEqual = (a: object, b: object): boolean => {
  if (Object.is(a, b)) return true;

  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);

  if (aKeys.length !== bKeys.length) return false;

  return aKeys.every(
    (key) =>
      Object.hasOwn(b, key) &&
      Object.is(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
      ),
  );
};
