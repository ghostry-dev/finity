import { FinityError } from "@ghostry/finity-core";
import { renderHook } from "@solidjs/testing-library";
import {
  attest,
  describe,
  expect,
  initialize,
  it,
  settle,
  test,
} from "./index.ts";

const finity = initialize({});

const State = finity
  .defineTransitionalState<{
    Loading: {};
    Ready: { resource: number };
    Errored: { error: Error };
  }>("MyState")
  .transitions({ Loading: ["Ready", "Errored"], Ready: [], Errored: [] });

test("transitioning the state", () => {
  const { result: state } = renderHook(finity.useStrictlyTransitionalState, {
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

describe("transitioning to a disallowed state", () => {
  it("does not transition", () => {
    const { result: state } = renderHook(finity.useStrictlyTransitionalState, {
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

      const { result: state } = renderHook(
        finity.useStrictlyTransitionalState,
        { initialProps: [State, () => ({ kind: "B" }) as const] },
      );

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

  describe("using the same transition function", () => {
    it("does not transition", () => {
      const { result: state } = renderHook(
        finity.useStrictlyTransitionalState,
        { initialProps: [State, () => ({ kind: "A" }) as const] },
      );

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
