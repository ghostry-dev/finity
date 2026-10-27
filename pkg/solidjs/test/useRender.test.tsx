import type {
  TransitionalStates,
  UsingStrictlyTransitionalState,
} from '@ghostry/finity-solidjs';
import { render, renderHook } from '@solidjs/testing-library';
import { onMount } from 'solid-js';
import { describe, expect, it, test, vi } from 'vitest';
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
  const { result: state } = renderHook(finity.useTransitionalState, {
    initialProps: [State, () => ({ kind: 'Loading' } as const)],
  });

  const { asFragment } = render(() =>
    finity
      .useRender(state.value)
      .case(['Loading', 'Ready', 'Errored'], (s) => s.kind)
      .use(),
  );

  expect(asFragment()).toBe('Loading');
});

test('providing the properties of the state to a case', async () => {
  const { result: state } = renderHook(finity.useTransitionalState, {
    initialProps: [State, () => ({ kind: 'Ready', resource: 1 } as const)],
  });

  let seen: unknown;

  render(() =>
    finity
      .useRender(state.value)
      .case(['Loading', 'Errored'], () => null)
      .case(['Ready'], (s) => {
        const { transition, ...rest } = s;
        seen = { rest, keys: Object.keys(s), has: 'resource' in s };
        return null;
      })
      .use(),
  );

  expect(seen).toEqual({
    rest: { kind: 'Ready', resource: 1 },
    keys: ['kind', 'resource', 'transition'],
    has: true,
  });
});

test('rendering a function returned by a case', async () => {
  const State = finity
    .defineTransitionalState<{
      A: { n: number };
      B: { n: number };
    }>('ab')
    .transitions({
      A: ['A', 'B'],
      B: [],
    });

  const { result: state } = renderHook(finity.useStrictlyTransitionalState, {
    initialProps: [State, () => ({ kind: 'A', n: 1 } as const)],
  });

  let calls = 0;

  const { container } = render(() =>
    finity
      .useRender(state.value)
      .case(['A', 'B'], (s) => {
        calls++;
        return () => `${s.kind}:${s.n}`;
      })
      .use(),
  );

  expect(container.textContent).toBe('A:1');

  const s1 = state.value();
  expect(s1.kind).toEqual('A');
  if (s1.kind !== 'A') return;
  s1.transition({ kind: 'A', n: 2 });

  expect(container.textContent).toBe('A:2');

  const s2 = state.value();
  expect(s2.kind).toEqual('A');
  if (s2.kind !== 'A') return;
  s2.transition({ kind: 'B', n: 2 });

  expect(container.textContent).toBe('B:2');
  expect(calls).toBe(1);
});

describe('rendering a case', () => {
  const State = finity
    .defineTransitionalState<{
      Loading: { id: string };
      Viewing: { id: string; data: number };
      Deleting: { id: string; data: number };
    }>('Resource')
    .transitions({
      Loading: ['Loading', 'Viewing'],
      Viewing: ['Viewing', 'Deleting'],
      Deleting: ['Loading', 'Viewing'],
    });

  type States = TransitionalStates<typeof State>;

  const renderCases = (finity: ReturnType<typeof initialize>) => {
    const mounts = { Loading: 0, Viewing: 0 };
    const seen: { Loading?: States['Loading'] } = {};
    let state!: UsingStrictlyTransitionalState<typeof State>;

    function Loading(props: { state: States['Loading'] }) {
      onMount(() => {
        mounts.Loading++;
        seen.Loading = props.state;
      });
      return (
        <p>
          {props.state.kind}:{props.state.id}
        </p>
      );
    }

    function Viewing(props: { state: States['Viewing'] | States['Deleting'] }) {
      onMount(() => mounts.Viewing++);
      return (
        <p>
          {props.state.kind}:{props.state.data}
        </p>
      );
    }

    const { container } = render(() => {
      state = finity.useStrictlyTransitionalState(
        State,
        () => ({ kind: 'Loading', id: 'x' } as const),
      );

      return finity
        .useRender(state.value)
        .case(['Loading'], (s) => <Loading state={s} />)
        .case(['Viewing', 'Deleting'], (s) => <Viewing state={s} />)
        .use();
    });

    const transition = (to: object): void =>
      (state.value().transition as (to: object) => void)(to);

    return { container, mounts, seen, transition, state: () => state.value() };
  };

  it('is not rendered again by a transition within the case', () => {
    const { container, mounts, transition } = renderCases(finity);

    expect(container.textContent).toBe('Loading:x');

    transition({ kind: 'Viewing', id: 'x', data: 1 });

    expect(container.textContent).toBe('Viewing:1');
    expect(mounts.Viewing).toBe(1);

    transition({ kind: 'Viewing', id: 'x', data: 2 });

    expect(container.textContent).toBe('Viewing:2');
    expect(mounts.Viewing).toBe(1);

    transition({ kind: 'Deleting', id: 'x', data: 2 });

    expect(container.textContent).toBe('Deleting:2');
    expect(mounts.Viewing).toBe(1);
  });

  it('is not rendered again by a transition to the same kind', () => {
    const { container, mounts, transition } = renderCases(finity);

    transition({ kind: 'Loading', id: 'x' });
    transition({ kind: 'Loading', id: 'y' });

    expect(container.textContent).toBe('Loading:y');
    expect(mounts.Loading).toBe(1);
  });

  it('is rendered again when the case changes', () => {
    const { container, mounts, transition } = renderCases(finity);

    transition({ kind: 'Viewing', id: 'x', data: 1 });
    transition({ kind: 'Deleting', id: 'x', data: 1 });
    transition({ kind: 'Loading', id: 'x' });

    expect(container.textContent).toBe('Loading:x');
    expect(mounts).toEqual({ Loading: 2, Viewing: 1 });
  });

  it('keeps the last state of the case after the case changes', () => {
    const onInvalidTransition = vi.fn();
    const { seen, transition, state } = renderCases(
      initialize({ onInvalidTransition }),
    );

    const loading = seen.Loading!;

    transition({ kind: 'Viewing', id: 'x', data: 1 });

    expect(loading.kind).toBe('Loading');
    expect(() =>
      loading.transition({ kind: 'Viewing', id: 'x', data: 2 }),
    ).not.toThrow();

    const { transition: _, ...s } = state();
    expect(s).toEqual({ kind: 'Viewing', id: 'x', data: 1 });

    expect(onInvalidTransition).toHaveBeenCalledOnce();
    expect(onInvalidTransition.mock.calls[0]![0].reason).toBe('stale');
  });
});
