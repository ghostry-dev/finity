import { InvalidTransitionError } from '@ghostry/finity-core';
import { renderHook } from '@solidjs/testing-library';
import { createComputed, createRoot, createSignal } from 'solid-js';
import { describe, expect, it, test, vi } from 'vitest';
import { initialize, testEffectInStages } from '.';

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
  const { result: state } = renderHook(finity.useTransitionalState, {
    initialProps: [State, () => ({ kind: 'Loading' } as const)],
  });

  await testEffectInStages((done) => [
    () => {
      const { transition, ...s } = state.value();
      expect(s).toEqual({ kind: 'Loading' });
      state.set({ kind: 'Ready', resource: 123 });
    },
    () => {
      const { transition, ...s } = state.value();
      expect(s).toEqual({ kind: 'Ready', resource: 123 });
      done();
    },
  ]);
});

test('transitioning the state', async () => {
  const { result: state } = renderHook(finity.useTransitionalState, {
    initialProps: [State, () => ({ kind: 'Loading' } as const)],
  });

  await testEffectInStages((done) => [
    () => {
      const s = state.value();
      expect(s.kind).toEqual('Loading');

      if (s.kind !== 'Loading') return;
      s.transition({ kind: 'Ready', resource: 123 });
    },
    () => {
      const { transition, ...s } = state.value();
      expect(s).toEqual({ kind: 'Ready', resource: 123 });
      done();
    },
  ]);
});

describe('the state object', () => {
  it('is the same between calls', () => {
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: 'Loading' } as const)],
    });

    expect(state.value()).toBe(state.value());
  });

  it('changes when the state changes', () => {
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: 'Loading' } as const)],
    });

    const s1 = state.value();

    state.set({ kind: 'Ready', resource: 123 });

    expect(state.value()).not.toBe(s1);
  });
});

describe('transitioning to a disallowed state', () => {
  it('does not transition', async () => {
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: 'Ready', resource: 1 } as const)],
    });

    const [current, trigger] = createSignal(0);

    await testEffectInStages((done) => [
      () => {
        const s1 = state.value();
        expect(s1.kind).toEqual('Ready');

        if (s1.kind !== 'Ready') return;
        s1.transition(
          /* @ts-expect-error */
          { kind: 'Errored', error: new Error('e') },
        );

        trigger(current() + 1);
      },
      () => {
        const { transition, ...s } = state.value();
        expect(s).toEqual({ kind: 'Ready', resource: 1 });
        done();
      },
    ]);
  });

  describe('with `onInvalidTransition` configured', () => {
    it('receives the transition context', async () => {
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

      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: 'B' } as const)],
      });

      const [current, trigger] = createSignal(0);

      await testEffectInStages((done) => [
        () => {
          state.value().transition(
            /* @ts-expect-error */
            { kind: 'A' },
          );

          /**
           * Since the transition above isn't expected to change the state,
           * the test times out since the next effect state is never
           * be triggered.  To trigger the next effect stage, a dummy signal
           * is read and written here.
           */
          trigger(current() + 1);
        },
        () => {
          expect($error).toBeInstanceOf(InvalidTransitionError);
          expect($error?.reason).toBe('disallowed');
          expect($error?.state.name).toStrictEqual('ab');
          expect($error?.state.from).toMatchObject({ kind: 'B' });
          expect($error?.state.to).toMatchObject({ kind: 'A' });
          expect($error?.tick.current).toBe(0);
          expect($error?.tick.bound).toBe(0);
          expect($error?.message).toBeTypeOf('string');
          expect($error?.stack).toBeTypeOf('string');

          done();
        },
      ]);
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
      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: 'A' } as const)],
      });

      await testEffectInStages((done) => [
        () => {
          const s1 = state.value();
          expect(s1.kind).toEqual('A');
          if (s1.kind !== 'A') return;

          state.set({ kind: 'B' });

          s1.transition({ kind: 'C' });
        },
        () => {
          const { transition, ...s } = state.value();
          expect(s).toEqual({ kind: 'B' });
          done();
        },
      ]);
    });
  });

  describe('using `update`', () => {
    it('does not transition', async () => {
      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: 'A' } as const)],
      });

      await testEffectInStages((done) => [
        () => {
          const s1 = state.value();
          expect(s1.kind).toEqual('A');
          if (s1.kind !== 'A') return;

          state.update(() => ({ kind: 'B' }));

          s1.transition({ kind: 'C' });
        },
        () => {
          const { transition, ...s } = state.value();
          expect(s).toEqual({ kind: 'B' });
          done();
        },
      ]);
    });
  });

  describe('using the same transition function', () => {
    it('does not transition', async () => {
      const { result: state } = renderHook(finity.useTransitionalState, {
        initialProps: [State, () => ({ kind: 'A' } as const)],
      });

      await testEffectInStages((done) => [
        () => {
          const s1 = state.value();
          expect(s1.kind).toEqual('A');
          if (s1.kind !== 'A') return;

          s1.transition({ kind: 'B' });

          s1.transition({ kind: 'C' });
        },
        () => {
          const { transition, ...s } = state.value();
          expect(s).toEqual({ kind: 'B' });
          done();
        },
      ]);
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
    const { result: state } = renderHook(finity.useTransitionalState, {
      initialProps: [State, () => ({ kind: 'A', n: 1 } as const)],
    });

    let updates = 0;

    createRoot(() =>
      createComputed(() => {
        state.value();
        updates++;
      }),
    );

    return { state, updates: () => updates };
  };

  it('does not update the state', () => {
    const { state, updates } = renderCountedHook(finity);

    const s1 = state.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    s1.transition({ kind: 'A', n: 1 });

    expect(updates()).toBe(1);
  });

  it('ignores the `transition` property', () => {
    const { state, updates } = renderCountedHook(finity);

    const s1 = state.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    s1.transition({ ...s1 });

    expect(updates()).toBe(1);
  });

  it('keeps the transition function valid', () => {
    const onInvalidTransition = vi.fn();
    const { state } = renderCountedHook(initialize({ onInvalidTransition }));

    const s1 = state.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    s1.transition({ kind: 'A', n: 1 });
    s1.transition({ kind: 'B' });

    const { transition, ...s } = state.value();
    expect(s).toEqual({ kind: 'B' });
    expect(onInvalidTransition).not.toHaveBeenCalled();
  });

  it('updates the state when it differs', () => {
    const { state, updates } = renderCountedHook(finity);

    const s1 = state.value();
    expect(s1.kind).toEqual('A');
    if (s1.kind !== 'A') return;

    s1.transition({ kind: 'A', n: 2 });

    expect(updates()).toBe(2);

    const { transition, ...s } = state.value();
    expect(s).toEqual({ kind: 'A', n: 2 });
  });

  describe('with `isEqualState` configured', () => {
    it('compares the states without the `transition` property', () => {
      const isEqualState = vi.fn((_a: object, _b: object) => false);
      const { state, updates } = renderCountedHook(
        initialize({ isEqualState }),
      );

      const s1 = state.value();
      expect(s1.kind).toEqual('A');
      if (s1.kind !== 'A') return;

      s1.transition({ ...s1 });

      expect(updates()).toBe(2);
      expect(isEqualState).toHaveBeenCalledTimes(1);
      expect(isEqualState).toHaveBeenCalledWith(
        { kind: 'A', n: 1 },
        { kind: 'A', n: 1 },
      );
    });
  });
});
