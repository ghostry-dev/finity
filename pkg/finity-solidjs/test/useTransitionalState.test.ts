import { FinityError } from "@ghostry/finity-core";
import { renderHook } from "@solidjs/testing-library";
import { createRoot } from "solid-js";
import {
  attest,
  describe,
  expect,
  initialize,
  it,
  settle,
  test,
  vi,
  watch,
} from "./index.ts";

const finity = initialize({});

const State = finity
  .defineTransitionalState<{
    Loading: {};
    Ready: { resource: number };
    Errored: { error: Error };
  }>("MyState")
  .transitions({ Loading: ["Ready", "Errored"], Ready: [], Errored: [] });

test("setting the state", () => {
  const { result: state } = renderHook(finity.useTransitionalState, {
    initialProps: [State, () => ({ kind: "Loading" }) as const],
  });

  const { transition: _, ...s1 } = state.value();
  expect(s1).toEqual({ kind: "Loading" });

  state.set({ kind: "Ready", resource: 123 });
  settle();

  const { transition, ...s2 } = state.value();
  expect(s2).toEqual({ kind: "Ready", resource: 123 });
});

test("transitioning the state", () => {
  const { result: state } = renderHook(finity.useTransitionalState, {
    initialProps: [State, () => ({ kind: "Loading" }) as const],
  });

  const s1 = state.value();
  expect(s1.kind).toEqual("Loading");
  if (s1.kind !== "Loading") return;

  s1.transition({ kind: "Ready", resource: 123 });
  settle();

  const { transition, ...s2 } = state.value();
  expect(s2).toEqual({ kind: "Ready", resource: 123 });
});

describe("the state object", () => {
  it("is the same between calls", () => {
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: "Loading" }) as const],
    });

    expect(state.value()).toBe(state.value());
  });

  it("changes when the state changes", () => {
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: "Loading" }) as const],
    });

    const s1 = state.value();

    state.set({ kind: "Ready", resource: 123 });
    settle();

    expect(state.value()).not.toBe(s1);
  });
});

describe("transitioning to a disallowed state", () => {
  it("does not transition", () => {
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: "Ready", resource: 1 }) as const],
    });

    const s1 = state.value();
    expect(s1.kind).toEqual("Ready");
    if (s1.kind !== "Ready") return;

    s1.transition(
      /* @ts-expect-error */
      { kind: "Errored", error: new Error("e") },
    );
    settle();

    const { transition, ...s } = state.value();
    expect(s).toEqual({ kind: "Ready", resource: 1 });
  });

  describe("with `onInvalidTransition` configured", () => {
    it("receives the transition context", () => {
      let $error: FinityError.InvalidTransitionError | undefined;

      const finity = initialize({
        onInvalidTransition: (error) => {
          $error = error;
        },
      });

      const State = finity
        .defineTransitionalState<{ A: {}; B: {} }>("ab")
        .transitions({ A: ["B"], B: [] });

      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: "B" }) as const],
      });

      state.value().transition(
        /* @ts-expect-error */
        { kind: "A" },
      );

      attest.instanceOf($error, FinityError.InvalidTransitionError);
      expect($error.name).toBe("@ghostry/finity-core:InvalidTransitionError");
      expect($error.reason).toBe("disallowed");
      expect($error.state.name).toStrictEqual("ab");
      expect($error.state.from).toMatchObject({ kind: "B" });
      expect($error.state.to).toMatchObject({ kind: "A" });
      expect($error.tick.current).toBe(0);
      expect($error.tick.bound).toBe(0);
      expect($error.message).toBeTypeOf("string");
      expect($error.stack).toBeTypeOf("string");
    });
  });
});

describe("transitioning after state already updated", () => {
  const State = finity
    .defineTransitionalState<{ A: {}; B: {}; C: {} }>("abc")
    .transitions({ A: ["B", "C"], B: ["C"], C: [] });

  describe("using `set`", () => {
    it("does not transition", () => {
      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: "A" }) as const],
      });

      const s1 = state.value();
      expect(s1.kind).toEqual("A");
      if (s1.kind !== "A") return;

      state.set({ kind: "B" });
      s1.transition({ kind: "C" });
      settle();

      const { transition, ...s } = state.value();
      expect(s).toEqual({ kind: "B" });
    });
  });

  describe("using `update`", () => {
    it("does not transition", () => {
      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: "A" }) as const],
      });

      const s1 = state.value();
      expect(s1.kind).toEqual("A");
      if (s1.kind !== "A") return;

      state.update(() => ({ kind: "B" }));
      s1.transition({ kind: "C" });
      settle();

      const { transition, ...s } = state.value();
      expect(s).toEqual({ kind: "B" });
    });
  });

  describe("using the same transition function", () => {
    it("does not transition", () => {
      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: "A" }) as const],
      });

      const s1 = state.value();
      expect(s1.kind).toEqual("A");
      if (s1.kind !== "A") return;

      s1.transition({ kind: "B" });
      s1.transition({ kind: "C" });
      settle();

      const { transition, ...s } = state.value();
      expect(s).toEqual({ kind: "B" });
    });
  });
});

describe("transitioning to an equal state", () => {
  const State = finity
    .defineTransitionalState<{ A: { n: number }; B: {} }>("ab")
    .transitions({ A: ["A", "B"], B: [] });

  const renderCountedHook = (finity: ReturnType<typeof initialize>) => {
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: "A", n: 1 }) as const],
    });

    let updates = 0;

    createRoot(() => watch(state.value, () => updates++));
    settle();

    return {
      state,
      updates: () => {
        settle();
        return updates;
      },
    };
  };

  it("does not update the state", () => {
    const { state, updates } = renderCountedHook(finity);

    const s1 = state.value();
    expect(s1.kind).toEqual("A");
    if (s1.kind !== "A") return;

    s1.transition({ kind: "A", n: 1 });

    expect(updates()).toBe(1);
  });

  it("ignores the `transition` property", () => {
    const { state, updates } = renderCountedHook(finity);

    const s1 = state.value();
    expect(s1.kind).toEqual("A");
    if (s1.kind !== "A") return;

    s1.transition({ ...s1 });

    expect(updates()).toBe(1);
  });

  it("keeps the transition function valid", () => {
    const onInvalidTransition = vi.fn();
    const { state } = renderCountedHook(initialize({ onInvalidTransition }));

    const s1 = state.value();
    expect(s1.kind).toEqual("A");
    if (s1.kind !== "A") return;

    s1.transition({ kind: "A", n: 1 });
    s1.transition({ kind: "B" });
    settle();

    const { transition, ...s } = state.value();
    expect(s).toEqual({ kind: "B" });
    expect(onInvalidTransition).not.toHaveBeenCalled();
  });

  it("updates the state when it differs", () => {
    const { state, updates } = renderCountedHook(finity);

    const s1 = state.value();
    expect(s1.kind).toEqual("A");
    if (s1.kind !== "A") return;

    s1.transition({ kind: "A", n: 2 });

    expect(updates()).toBe(2);

    const { transition, ...s } = state.value();
    expect(s).toEqual({ kind: "A", n: 2 });
  });

  describe("with `isEqualState` configured", () => {
    it("compares the states without the `transition` property", () => {
      const isEqualState = vi.fn((_a: object, _b: object) => false);
      const { state, updates } = renderCountedHook(
        initialize({ isEqualState }),
      );

      const s1 = state.value();
      expect(s1.kind).toEqual("A");
      if (s1.kind !== "A") return;

      s1.transition({ ...s1 });

      expect(updates()).toBe(2);
      expect(isEqualState).toHaveBeenCalledTimes(1);
      expect(isEqualState).toHaveBeenCalledWith(
        { kind: "A", n: 1 },
        { kind: "A", n: 1 },
      );
    });
  });
});
