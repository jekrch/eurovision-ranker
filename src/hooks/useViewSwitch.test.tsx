// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useViewSwitch } from './useViewSwitch';

describe('useViewSwitch', () => {
  it('reports no switch for the view the page loaded with', () => {
    expect(renderHook(() => useViewSwitch(true)).result.current).toBeNull();
    expect(renderHook(() => useViewSwitch(false)).result.current).toBeNull();
  });

  it('reports a move to the details view', () => {
    const { result, rerender } = renderHook(({ showUnranked }) => useViewSwitch(showUnranked), {
      initialProps: { showUnranked: true },
    });

    rerender({ showUnranked: false });

    expect(result.current).toBe('toDetails');
  });

  it('reports a move back to the select view', () => {
    const { result, rerender } = renderHook(({ showUnranked }) => useViewSwitch(showUnranked), {
      initialProps: { showUnranked: true },
    });

    rerender({ showUnranked: false });
    rerender({ showUnranked: true });

    expect(result.current).toBe('toSelect');
  });

  it('keeps the last direction across renders that stay on the same view', () => {
    const { result, rerender } = renderHook(({ showUnranked }) => useViewSwitch(showUnranked), {
      initialProps: { showUnranked: true },
    });

    rerender({ showUnranked: false });
    rerender({ showUnranked: false });

    expect(result.current).toBe('toDetails');
  });
});
