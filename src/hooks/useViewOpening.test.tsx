// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useViewOpening } from './useViewOpening';

// The hook reads the clock during render, so the tests drive it with a fake one
// rather than waiting out the real window.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('useViewOpening', () => {
  it('stages the items a view opens with', () => {
    const { result } = renderHook(() => useViewOpening(true));

    expect(result.current).toBe(true);
  });

  it('holds the entrance until the view has something to show', () => {
    const { result, rerender } = renderHook(({ hasContent }) => useViewOpening(hasContent), {
      initialProps: { hasContent: false },
    });

    expect(result.current).toBe(false);

    // a cold load renders empty while the contest data is in flight; the
    // entrance belongs to the paint that finally has rows
    vi.advanceTimersByTime(2000);
    rerender({ hasContent: true });

    expect(result.current).toBe(true);
  });

  it('stops staging items that arrive after the view has settled', () => {
    const { result, rerender } = renderHook(({ hasContent }) => useViewOpening(hasContent), {
      initialProps: { hasContent: true },
    });

    vi.advanceTimersByTime(2000);
    rerender({ hasContent: true });

    expect(result.current).toBe(false);
  });

  it('opens once per view rather than on every change of content', () => {
    const { result, rerender } = renderHook(({ hasContent }) => useViewOpening(hasContent), {
      initialProps: { hasContent: true },
    });

    vi.advanceTimersByTime(2000);
    // emptying and refilling the list is an edit, not a new view
    rerender({ hasContent: false });
    rerender({ hasContent: true });

    expect(result.current).toBe(false);
  });
});
