import type { Config, InitialValue } from "./Types.ts";

export interface UseState<T extends {}> {
  value(): T;
  set(value: T): T;
  update(fn: (prev: T) => T): T;
}

export type UseStateHook = <T extends {}>(
  initial: InitialValue<T>,
) => UseState<T>;

export default (config: Config): UseStateHook => {
  return <T extends {}>(initial: InitialValue<T>): UseState<T> => {
    const initialValue = (): Exclude<T, Function> =>
      initial instanceof Function
        ? (initial() as Exclude<T, Function>)
        : initial;

    const [value, setValue] = config.useState<T>(initialValue);

    const set = (value: T): T => setValue((_prev) => value);

    const update = (fn: (prev: T) => T): T => setValue((prev) => fn(prev));

    return { value, set, update } as const;
  };
};
