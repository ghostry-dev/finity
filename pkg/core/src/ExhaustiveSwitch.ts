import type {
  FundamentalState,
  Getter,
  IsUnique,
  UnhandledStates,
} from './Types';

/**
 * The implementation type for exhaustive state switching.
 *
 * The result of `use` is `R`, and the result of each case's function is `F`,
 * which is also `R` unless an implementation accepts more from its cases.
 *
 * @protected
 */
export type ExhaustiveSwitch<
  R,
  S extends FundamentalState,
  C extends S['kind'],
  F = R,
> = {
  /**
   * @param kinds - The `kind` of states that will be handled in this case.
   * If the list contains duplicates, a type error will be raised:
   * ```txt
   * Argument of type 'string[]' is not assignable to parameter of type 'never'.
   * ```
   *
   * @param fn - The function to evaluate when the state matches the
   * given `kinds`.
   */
  case: <const G extends Exclude<S['kind'], C>[]>(
    kinds: IsUnique<[...G]> extends true ? [...G] : never,
    fn: (state: S extends { kind: G[number] } ? S : never) => F,
  ) => ExhaustiveSwitch<R, S, C | G[number], F>;
  use: Exclude<S['kind'], C> extends infer U
    ? [U] extends [never]
      ? () => R
      : UnhandledStates<U>
    : never;
};

/**
 * The implementation class for exhaustive state switching.
 *
 * @protected
 */
export class ExhaustiveSwitchInstance<R, S extends FundamentalState> {
  constructor(
    protected readonly state: Getter<S>,
    protected cases: [string[], (state: S) => R][],
  ) {}

  public case = (kinds: string[], fn: (state: S) => R): typeof this => {
    this.cases = [...this.cases, [kinds, fn]];
    return this;
  };

  public use = (): R => {
    const s = this.state();
    const found = this.cases.find(([kinds, _]) => kinds.includes(s.kind));
    if (found) {
      const [_, fn] = found;
      return fn(s);
    } else {
      throw new Error('[finity] Invalid state switch!');
    }
  };
}
