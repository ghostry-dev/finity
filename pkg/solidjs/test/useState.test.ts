import { renderHook } from "@solidjs/testing-library";
import {
  describe,
  expect,
  initialize,
  test,
  testEffectInStages,
} from "./index.ts";

const finity = initialize({});

test("setting the state", async () => {
  const { result: state } = renderHook(finity.useState, { initialProps: [0] });

  await testEffectInStages((done) => [
    () => {
      expect(state.value()).toEqual(0);
      state.set(1);
    },
    () => {
      expect(state.value()).toEqual(1);
      done();
    },
  ]);
});

test("updating the state", async () => {
  const { result: state } = renderHook(finity.useState, { initialProps: [0] });

  await testEffectInStages((done) => [
    () => {
      expect(state.value()).toEqual(0);
      state.update((prev) => prev + 1);
    },
    () => {
      expect(state.value()).toEqual(1);
      done();
    },
  ]);
});

describe("initial value deferred with a function", () => {
  test("setting the state", async () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [() => 0],
    });

    await testEffectInStages((done) => [
      () => {
        expect(state.value()).toBe(0);
        state.set(1);
      },
      () => {
        expect(state.value()).toEqual(1);
        done();
      },
    ]);
  });

  test("updating the state", async () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [() => 0],
    });

    await testEffectInStages((done) => [
      () => {
        expect(state.value()).toBe(0);
        state.update((prev) => prev + 1);
      },
      () => {
        expect(state.value()).toEqual(1);
        done();
      },
    ]);
  });
});

describe("a function as the state value", () => {
  test("setting the state", async () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [(): (() => number) => () => 0],
    });

    await testEffectInStages((done) => [
      () => {
        expect(state.value()()).toBe(0);
        state.set(() => 1);
      },
      () => {
        expect(state.value()()).toEqual(1);
        done();
      },
    ]);
  });

  test("updating the state", async () => {
    const { result: state } = renderHook(finity.useState, {
      initialProps: [(): (() => number) => () => 0],
    });

    await testEffectInStages((done) => [
      () => {
        expect(state.value()()).toBe(0);
        state.update((prev) => () => prev() + 1);
      },
      () => {
        expect(state.value()()).toEqual(1);
        done();
      },
    ]);
  });
});
