export type StateDefinition<K extends string> = {
  [k in K]: Record<string, any>;
};

export type TransitionsDefinition<K extends string> = Record<K, NoInfer<K[]>>;

export type FiniteStateByKind<
  K extends string,
  S extends StateDefinition<K>,
> = { [k in K]: { kind: k } & S[k] };

export type FiniteStateUnion<
  K extends string,
  S extends StateDefinition<K>,
> = FiniteStateByKind<K, S>[K];

export type TransitionalStateByKind<
  K extends string,
  S extends StateDefinition<K>,
  X extends TransitionsDefinition<K>,
> = {
  [k in K]: { kind: k } & S[k] & {
      transition: (
        to: Exclude<
          X[k] extends never[]
            ? never
            : { [R in X[k][number]]: { kind: R } & S[R] }[X[k][number]],
          Function
        >,
      ) => void;
    };
};

export type TransitionalStateUnion<
  K extends string,
  S extends StateDefinition<K>,
  X extends TransitionsDefinition<K>,
> = TransitionalStateByKind<K, S, X>[K];
