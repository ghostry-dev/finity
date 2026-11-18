import type { StateDefinition, TransitionsDefinition } from './States.ts';

export interface DefinedTransitionalState<
  K extends string,
  _S extends StateDefinition<K>,
  X extends TransitionsDefinition<K>,
> {
  name?: string;
  transitions: X;
}

type DefinedFiniteState<K extends string, S extends StateDefinition<K>> = {
  name?: string;
  transitions: <const X extends TransitionsDefinition<K>>(
    transitions: X & { [k in keyof X]: k extends K ? X[k] : never },
  ) => DefinedTransitionalState<K, S, X>;
};

export const defineTransitionalState = <
  S extends StateDefinition<string> = never,
>(
  name?: string,
): DefinedFiniteState<Extract<keyof S, string>, S> => {
  type K = Extract<keyof S, string>;

  const defined: DefinedFiniteState<K, S> = {
    name,
    transitions: <const X extends TransitionsDefinition<K>>(
      transitions: X,
    ): DefinedTransitionalState<K, S, X> => {
      return { name, transitions };
    },
  };

  return defined;
};
