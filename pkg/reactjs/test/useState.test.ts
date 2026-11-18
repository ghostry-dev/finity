import { renderHook } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { initialize } from './index.ts';

const finity = initialize({});

test('setting the state', async () => {
  const { result, rerender } = renderHook(() => finity.useState(0));

  expect(result.current.value()).toBe(0);

  result.current.set(1);
  rerender();

  expect(result.current.value()).toBe(1);
});

test('updating the state', async () => {
  const { result, rerender } = renderHook(() => finity.useState(0));

  expect(result.current.value()).toBe(0);

  result.current.update((prev) => prev + 1);
  rerender();

  expect(result.current.value()).toBe(1);
});

describe('initial value deferred with a function', () => {
  test('setting the state', async () => {
    const { result, rerender } = renderHook(() => finity.useState(() => 0));

    expect(result.current.value()).toBe(0);

    result.current.set(1);
    rerender();

    expect(result.current.value()).toBe(1);
  });

  test('updating the state', async () => {
    const { result, rerender } = renderHook(() => finity.useState(() => 0));

    expect(result.current.value()).toBe(0);

    result.current.update((prev) => prev + 1);
    rerender();

    expect(result.current.value()).toBe(1);
  });
});

describe('a function as the state value', () => {
  test('setting the state', async () => {
    const { result, rerender } = renderHook(() =>
      finity.useState((): (() => number) => () => 0),
    );

    expect(result.current.value()()).toBe(0);

    result.current.set(() => 1);
    rerender();

    expect(result.current.value()()).toBe(1);
  });

  test('updating the state', async () => {
    const { result, rerender } = renderHook(() =>
      finity.useState((): (() => number) => () => 0),
    );

    expect(result.current.value()()).toBe(0);

    result.current.update((prev) => () => prev() + 1);
    rerender();

    expect(result.current.value()()).toBe(1);
  });
});
