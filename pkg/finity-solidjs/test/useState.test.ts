import { renderHook } from "@solidjs/testing-library";
import { describe, expect, initialize, settle, test } from "./index.ts";

const finity = initialize({});

test("setting the state", () => {
  const { result: state } = renderHook(finity.useState, { initialProps: [0] });

  expect(state.value()).toEqual(0);

  state.set(1);
  settle();

  expect(state.value()).toEqual(1);
});

test("updating the state", () => {
  const { result: state } = renderHook(finity.useState, { initialProps: [0] });

  expect(state.value()).toEqual(0);

  state.update((prev) => prev + 1);
  settle();

  expect(state.value()).toEqual(1);
});

describe("initial value deferred with a function", () => {
  test("setting the state", () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [() => 0],
    });

    expect(state.value()).toBe(0);

    state.set(1);
    settle();

    expect(state.value()).toEqual(1);
  });

  test("updating the state", () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [() => 0],
    });

    expect(state.value()).toBe(0);

    state.update((prev) => prev + 1);
    settle();

    expect(state.value()).toEqual(1);
  });
});

describe("a function as the state value", () => {
  test("setting the state", () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [(): (() => number) => () => 0],
    });

    expect(state.value()()).toBe(0);

    state.set(() => 1);
    settle();

    expect(state.value()()).toEqual(1);
  });

  test("updating the state", () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [(): (() => number) => () => 0],
    });

    expect(state.value()()).toBe(0);

    state.update((prev) => () => prev() + 1);
    settle();

    expect(state.value()()).toEqual(1);
  });
});
