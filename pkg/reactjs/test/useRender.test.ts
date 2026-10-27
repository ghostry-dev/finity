import { renderHook } from '@testing-library/react';
import { expect, test } from 'vitest';
import { initialize } from '.';

const finity = initialize({});

const State = finity
  .defineTransitionalState<{
    Loading: {};
    Ready: { resource: number };
    Errored: { error: Error };
  }>('MyState')
  .transitions({
    Loading: ['Ready', 'Errored'],
    Ready: [],
    Errored: [],
  });

test('rendering based on the state', async () => {
  const { result } = renderHook(() =>
    finity.useTransitionalState(State, () => ({ kind: 'Loading' } as const)),
  );

  const { result: fragment } = renderHook(() =>
    finity
      .useRender(result.current.value)
      .case(['Loading', 'Ready', 'Errored'], (s) => s.kind)
      .use(),
  );

  expect(fragment.current).toBe('Loading');
});

test('rendering with the case function of the latest render', async () => {
  const { result, rerender } = renderHook(
    ({ n }: { n: number }) => {
      const state = finity.useTransitionalState(
        State,
        () => ({ kind: 'Loading' } as const),
      );

      return finity
        .useRender(state.value)
        .case(['Loading', 'Ready', 'Errored'], (s) => `${s.kind}:${n}`)
        .use();
    },
    { initialProps: { n: 1 } },
  );

  expect(result.current).toBe('Loading:1');

  rerender({ n: 2 });

  expect(result.current).toBe('Loading:2');
});
