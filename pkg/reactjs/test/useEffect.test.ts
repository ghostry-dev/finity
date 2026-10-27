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

test('transitioning the state', async () => {
  const { result, rerender } = renderHook(() =>
    finity.useTransitionalState(State, () => ({ kind: 'Loading' } as const)),
  );

  expect(result.current.value().kind).toEqual('Loading');

  renderHook(() =>
    finity
      .useEffect(result.current.value)
      .case(['Loading'], async (s) => {
        s.transition({ kind: 'Ready', resource: 123 });
      })
      .case(['Ready', 'Errored'], (s) => {
        throw `Unexpected state: ${s.kind}`;
      })
      .use(),
  );

  rerender();

  const { transition, ...s } = result.current.value();

  expect(s).toEqual({ kind: 'Ready', resource: 123 });
});

test('running the effect only when the state changes', async () => {
  const runs: string[] = [];

  const { rerender } = renderHook(() => {
    const state = finity.useStrictlyTransitionalState(
      State,
      () => ({ kind: 'Loading' } as const),
    );

    finity
      .useEffect(state.value)
      .case(['Loading'], ({ kind, transition }) => {
        runs.push(kind);
        transition({ kind: 'Ready', resource: 123 });
      })
      .case(['Ready', 'Errored'], ({ kind }) => {
        runs.push(kind);
      })
      .use();
  });

  expect(runs).toEqual(['Loading', 'Ready']);

  rerender();
  rerender();

  expect(runs).toEqual(['Loading', 'Ready']);
});
