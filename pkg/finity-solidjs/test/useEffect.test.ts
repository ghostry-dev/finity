import { renderHook } from "@solidjs/testing-library";
import { createSignal } from "solid-js";
import {
  describe,
  expect,
  initialize,
  isSolid2,
  it,
  settle,
  spyOn,
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
  const seen: string[] = [];

  const { result: state } = renderHook(() => {
    const state = finity.useTransitionalState(State, () => ({
      kind: "Loading",
    }));

    finity
      .useEffect(state.value)
      .case(["Loading"], (s) => {
        seen.push(s.kind);
        s.transition({ kind: "Ready", resource: 123 });
      })
      .case(["Ready", "Errored"], (s) => {
        seen.push(s.kind);
      })
      .use();

    return state;
  });

  settle();

  const { transition, ...s } = state.value();
  expect(s).toEqual({ kind: "Ready", resource: 123 });
  expect(seen).toEqual(["Loading", "Ready"]);
});

describe("a case", () => {
  it("runs again only when the state changes", () => {
    /**
     * Solid 2 warns that the case's read of `other` won't rerun it, which is
     * what this tests.
     */
    const warn = spyOn(console, "warn").mockImplementation(() => {});

    const [other, setOther] = createSignal(0);
    let runs = 0;

    const { result: state } = renderHook(() => {
      const state = finity.useTransitionalState(State, () => ({
        kind: "Loading",
      }));

      finity
        .useEffect(state.value)
        .case(["Loading", "Ready", "Errored"], () => {
          other();
          runs++;
        })
        .use();

      return state;
    });

    settle();
    expect(runs).toBe(1);

    setOther(1);
    settle();
    expect(runs).toBe(1);

    state.set({ kind: "Ready", resource: 1 });
    settle();
    expect(runs).toBe(2);

    if (isSolid2) expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
