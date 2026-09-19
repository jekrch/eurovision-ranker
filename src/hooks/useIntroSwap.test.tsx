// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useIntroSwap } from './useIntroSwap';

// The intro's exit runs on a timer, so the tests drive it with a fake clock
// rather than waiting out the animation.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

const renderSwap = (isEmpty: boolean, isArmed = true, exitMs?: number) =>
  renderHook(({ isEmpty, isArmed, exitMs }) => useIntroSwap(isEmpty, isArmed, exitMs), {
    initialProps: { isEmpty, isArmed, exitMs },
  });

describe('useIntroSwap', () => {
  it('shows the intro in an empty column without animating it', () => {
    const { result } = renderSwap(true);

    expect(result.current).toEqual({ showIntro: true, introPhase: 'idle' });
  });

  it('shows no intro once the column has rows', () => {
    const { result } = renderSwap(false);

    expect(result.current).toEqual({ showIntro: false, introPhase: 'idle' });
  });

  it('keeps the intro on screen while it leaves for the first country in', () => {
    const { result, rerender } = renderSwap(true);

    rerender({ isEmpty: false, isArmed: true, exitMs: undefined });

    expect(result.current).toEqual({ showIntro: true, introPhase: 'leaving' });
  });

  it('lets the intro go once its exit has played out', () => {
    const { result, rerender } = renderSwap(true);
    rerender({ isEmpty: false, isArmed: true, exitMs: undefined });

    act(() => {
      vi.advanceTimersByTime(240);
    });

    expect(result.current).toEqual({ showIntro: false, introPhase: 'idle' });
  });

  it('holds the intro for as long as the exit it is given', () => {
    const { result, rerender } = renderSwap(true, true, 150);
    rerender({ isEmpty: false, isArmed: true, exitMs: 150 });

    act(() => {
      vi.advanceTimersByTime(149);
    });
    expect(result.current.introPhase).toBe('leaving');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toEqual({ showIntro: false, introPhase: 'idle' });
  });

  it('brings the intro back in when the last country goes', () => {
    const { result, rerender } = renderSwap(false);

    rerender({ isEmpty: true, isArmed: true, exitMs: undefined });

    expect(result.current).toEqual({ showIntro: true, introPhase: 'entering' });
  });

  it('swaps without animating before the column is armed', () => {
    // a cold load fills the column when the ranking lands, which isn't an
    // addition anyone made
    const { result, rerender } = renderSwap(true, false);

    rerender({ isEmpty: false, isArmed: true, exitMs: undefined });

    expect(result.current).toEqual({ showIntro: false, introPhase: 'idle' });
  });

  it('swaps without animating for someone who prefers reduced motion', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true } as MediaQueryList));
    const { result, rerender } = renderSwap(true);

    rerender({ isEmpty: false, isArmed: true, exitMs: undefined });

    expect(result.current).toEqual({ showIntro: false, introPhase: 'idle' });
  });
});
