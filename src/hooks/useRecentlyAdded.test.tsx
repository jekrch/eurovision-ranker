// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { RankingAddition, useRecentlyAdded } from './useRecentlyAdded';

// The hook reads the clock during render, so the tests drive it with a fake one
// rather than waiting out the real window.
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

const renderAdditions = (initial: RankingAddition | null) =>
  renderHook(({ latest }) => useRecentlyAdded(latest), { initialProps: { latest: initial } });

describe('useRecentlyAdded', () => {
  it('flags a country the moment it is added', () => {
    const { result } = renderAdditions({ id: 'se', at: Date.now() });

    expect(result.current('se')).toBe(true);
  });

  it('leaves countries that were already ranked alone', () => {
    const { result } = renderAdditions({ id: 'se', at: Date.now() });

    expect(result.current('no')).toBe(false);
  });

  it('flags nothing before anything has been added', () => {
    const { result } = renderAdditions(null);

    expect(result.current('se')).toBe(false);
  });

  it('keeps every country from a quick run of additions flagged', () => {
    const { result, rerender } = renderAdditions({ id: 'se', at: Date.now() });

    vi.advanceTimersByTime(100);
    rerender({ latest: { id: 'no', at: Date.now() } });

    expect(result.current('se')).toBe(true);
    expect(result.current('no')).toBe(true);
  });

  it('stops flagging a country once it has settled into the ranking', () => {
    const latest = { id: 'se', at: Date.now() };
    const { result, rerender } = renderAdditions(latest);

    vi.advanceTimersByTime(2000);
    rerender({ latest });

    expect(result.current('se')).toBe(false);
  });

  it('does not flag an old addition again when the list is rebuilt', () => {
    const latest = { id: 'se', at: Date.now() };
    renderAdditions(latest).unmount();

    vi.advanceTimersByTime(2000);
    const { result } = renderAdditions(latest);

    expect(result.current('se')).toBe(false);
  });
});
