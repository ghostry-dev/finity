import { FinityError } from '@ghostry/finity-core';
import { renderHook } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { describe, expect, it, test } from 'vitest';
import { initialize, testEffectInStages } from './index.ts';

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
  const { result: state } = renderHook(finity.useStrictlyTransitionalState, {
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

describe('transitioning to a disallowed state', () => {
  it('does not transition', async () => {
    const { result: state } = renderHook(finity.useStrictlyTransitionalState, {
      initialProps: [State, () => ({ kind: 'Ready', resource: 1 } as const)],
    });

    await testEffectInStages((done) => [
      () => {
        const s1 = state.value();
        expect(s1.kind).toEqual('Ready');

        if (s1.kind !== 'Ready') return;
        s1.transition(
          /* @ts-expect-error */
          { kind: 'Errored', error: new Error('e') },
        );

        const { transition, ...s } = state.value();
        expect(s).toEqual({ kind: 'Ready', resource: 1 });
        done();
      },
    ]);
  });

  describe('with `onInvalidTransition` configured', () => {
    it('receives the transition context', async () => {
      let $error: FinityError.InvalidTransitionError | undefined;

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

      const { result: state } = renderHook(
        finity.useStrictlyTransitionalState,
        {
          initialProps: [State, () => ({ kind: 'B' } as const)],
        },
      );

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
          expect($error).toBeInstanceOf(FinityError.InvalidTransitionError);
          expect($error?.name).toBe(
            '@ghostry/finity-core:InvalidTransitionError',
          );
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

  describe('using the same transition function', () => {
    it('does not transition', async () => {
      const { result: state } = renderHook(
        finity.useStrictlyTransitionalState,
        {
          initialProps: [State, () => ({ kind: 'A' } as const)],
        },
      );

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
