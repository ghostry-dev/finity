import { InvalidTransitionError } from '@ghostry/finity-core';
import { act, renderHook } from '@testing-library/react';
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

test('setting the state', async () => {
  const { result, rerender } = renderHook(() =>
    finity.useTransitionalState(State, () => ({ kind: 'Loading' } as const)),
  );

  const { transition: _t1, ...s1 } = result.current.value();
  expect(s1).toEqual({ kind: 'Loading' });

  result.current.set({ kind: 'Ready', resource: 123 });

  rerender();

  const { transition: _t2, ...s2 } = result.current.value();
  expect(s2).toEqual({ kind: 'Ready', resource: 123 });
});

test('transitioning the state', async () => {
  const { result, rerender } = renderHook(() =>
    finity.useTransitionalState(State, () => ({ kind: 'Loading' } as const)),
  );

  const s1 = result.current.value();
  expect(s1.kind).toEqual('Loading');

  if (s1.kind !== 'Loading') return;
  s1.transition({ kind: 'Ready', resource: 123 });

  rerender();

  const { transition: _t2, ...s2 } = result.current.value();
  expect(s2).toEqual({ kind: 'Ready', resource: 123 });
});

describe('transitioning to a disallowed state', () => {
  it('does not transition', () => {
    const { result, rerender } = renderHook(() =>
      finity.useTransitionalState(State, () => ({
        kind: 'Ready',
        resource: 1,
      })),
    );

    const s1 = result.current.value();
    expect(s1.kind).toEqual('Ready');

    if (s1.kind !== 'Ready') return;
    s1.transition(
      /* @ts-expect-error */
      { kind: 'Errored', error: new Error('e') },
    );

    rerender();

    const { transition: _t2, ...s2 } = result.current.value();
    expect(s2).toEqual({ kind: 'Ready', resource: 1 });
  });

  describe('with `onInvalidTransition` configured', () => {
    it('receives the transition context', () => {
      let $error: InvalidTransitionError | undefined;

      const finity = initialize({
        onInvalidTransition: (error) => {
          $error = error;
        },
      });

      const State = finity
        .defineTransitionalState<{
          A: {};
          B: {};
        }>('ab')
        .transitions({
          A: ['B'],
          B: [],
        });

      const { result } = renderHook(() =>
        finity.useTransitionalState(State, () => ({ kind: 'B' })),
      );

      result.current.value().transition(
        /* @ts-expect-error */
        { kind: 'A' },
      );

      expect($error).toBeInstanceOf(InvalidTransitionError);
      expect($error?.reason).toBe('disallowed');
      expect($error?.state.name).toStrictEqual('ab');
      expect($error?.state.from).toMatchObject({ kind: 'B' });
      expect($error?.state.to).toMatchObject({ kind: 'A' });
      expect($error?.tick.current).toBe(0);
      expect($error?.tick.bound).toBe(0);
      expect($error?.message).toBeTypeOf('string');
      expect($error?.stack).toBeTypeOf('string');
    });
  });
});

describe('transitioning after state already updated', () => {
  const State = finity
    .defineTransitionalState<{
      A: {};
      B: {};
      C: {};
    }>('abc')
    .transitions({
      A: ['B', 'C'],
      B: ['C'],
      C: [],
    });

  describe('using `set`', () => {
    it('does not transition', async () => {
      const { result, rerender } = renderHook(() =>
        finity.useTransitionalState(State, () => ({ kind: 'A' })),
      );

      const s1 = result.current.value();
      expect(s1.kind).toEqual('A');
      if (s1.kind !== 'A') return;

      result.current.set({ kind: 'B' });

      rerender();

      s1.transition({ kind: 'C' });

      rerender();

      const { transition, ...s } = result.current.value();
      expect(s).toEqual({ kind: 'B' });
    });
  });

  describe('using `update`', () => {
    it('does not transition', async () => {
      const { result, rerender } = renderHook(() =>
        finity.useTransitionalState(State, () => ({ kind: 'A' })),
      );

      const s1 = result.current.value();
      expect(s1.kind).toEqual('A');
      if (s1.kind !== 'A') return;

      result.current.update(() => ({ kind: 'B' }));

      rerender();

      s1.transition({ kind: 'C' });

      rerender();

      const { transition, ...s } = result.current.value();
      expect(s).toEqual({ kind: 'B' });
    });
  });

  describe('using the same transition function', () => {
    it('does not transition', async () => {
      const { result, rerender } = renderHook(() =>
        finity.useTransitionalState(State, () => ({ kind: 'A' })),
      );

      const s1 = result.current.value();
      expect(s1.kind).toEqual('A');
      if (s1.kind !== 'A') return;

      s1.transition({ kind: 'B' });

      rerender();

      s1.transition({ kind: 'C' });

      rerender();

      const { transition, ...s } = result.current.value();
      expect(s).toEqual({ kind: 'B' });
    });
  });
});

describe('transitioning to an equal state', () => {
  const State = finity
    .defineTransitionalState<{
      A: { n: number };
      B: {};
    }>('ab')
    .transitions({
      A: ['A', 'B'],
      B: [],
    });

  const renderCountedHook = (finity: ReturnType<typeof initialize>) => {
    let renders = 0;

    const { result } = renderHook(() => {
      renders++;
      return finity.useTransitionalState(State, () => ({ kind: 'A', n: 1 }));
    });

    return { result, renders: () => renders };
  };

  it('does not update the state', () => {
    const { result, renders } = renderCountedHook(finity);

    const s1 = result.current.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    act(() => s1.transition({ kind: 'A', n: 1 }));

    expect(renders()).toBe(1);
  });

  it('ignores the `transition` property', () => {
    const { result, renders } = renderCountedHook(finity);

    const s1 = result.current.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    act(() => s1.transition({ ...s1 }));

    expect(renders()).toBe(1);
  });

  it('keeps the transition function valid', () => {
    const onInvalidTransition = vi.fn();
    const { result } = renderCountedHook(initialize({ onInvalidTransition }));

    const s1 = result.current.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    act(() => s1.transition({ kind: 'A', n: 1 }));
    act(() => s1.transition({ kind: 'B' }));

    const { transition, ...s } = result.current.value();
    expect(s).toEqual({ kind: 'B' });
    expect(onInvalidTransition).not.toHaveBeenCalled();
  });

  it('updates the state when it differs', () => {
    const { result, renders } = renderCountedHook(finity);

    const s1 = result.current.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    act(() => s1.transition({ kind: 'A', n: 2 }));

    expect(renders()).toBe(2);

    const { transition, ...s } = result.current.value();
    expect(s).toEqual({ kind: 'A', n: 2 });
  });

  describe('with `isEqualState` configured', () => {
    it('compares the states without the `transition` property', () => {
      const isEqualState = vi.fn((_a: object, _b: object) => false);
      const { result, renders } = renderCountedHook(
        initialize({ isEqualState }),
      );

      const s1 = result.current.value();
      expect(s1.kind).toEqual('A');
      if (s1.kind !== 'A') return;

      act(() => s1.transition({ ...s1 }));

      expect(renders()).toBe(2);
      expect(isEqualState).toHaveBeenCalledTimes(1);
      expect(isEqualState).toHaveBeenCalledWith(
        { kind: 'A', n: 1 },
        { kind: 'A', n: 1 },
      );
    });
  });
});
