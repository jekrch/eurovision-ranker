// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// The hook delegates the actual URL rewrite to UrlUtil; stub it so we can
// assert it's invoked with the post-merge state without touching the real URL.
vi.mock('../utilities/UrlUtil', () => ({
  updateUrlFromRankedItems: vi.fn(),
}));

import { useRefreshUrl } from './useRefreshUrl';
import { Category } from '../utilities/CategoryUtil';
import { CountryContestant } from '../data/CountryContestant';
import { updateUrlFromRankedItems } from '../utilities/UrlUtil';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

const cc = (id: string): CountryContestant =>
  ({ id, uid: id, country: { id, key: id, name: id }, contestant: null }) as CountryContestant;

const cat = (name: string) => ({ name }) as Category;
const mocked = vi.mocked(updateUrlFromRankedItems);

describe('useRefreshUrl', () => {
  beforeEach(() => {
    mocked.mockClear();
    window.history.replaceState(null, '', '/');
  });

  it('refreshUrl forwards the active category, categories, and ranked items', () => {
    const rankedItems = [cc('a')];
    const categories = [cat('c1')];
    const store = makeTestStore({ root: { rankedItems, categories, activeCategory: 1 } });

    const { result } = renderHook(() => useRefreshUrl(), { wrapper: storeWrapper(store) });
    act(() => result.current.refreshUrl());

    expect(mocked).toHaveBeenCalledWith(1, categories, rankedItems);
  });

  it('handleAddAllUnranked merges unranked into ranked and clears unranked', async () => {
    const store = makeTestStore({
      root: { rankedItems: [cc('a')], unrankedItems: [cc('b'), cc('c')], categories: [cat('c1')] },
    });

    const { result } = renderHook(() => useRefreshUrl(), { wrapper: storeWrapper(store) });
    mocked.mockClear();

    await act(async () => {
      result.current.handleAddAllUnranked();
    });

    const state = store.getState().root;
    expect(state.rankedItems.map((i) => i.uid)).toEqual(['a', 'b', 'c']);
    expect(state.unrankedItems).toHaveLength(0);

    // it writes the category ranking params into the URL...
    expect(new URLSearchParams(window.location.search).get('r1')).toContain('bc');

    // ...and the shouldRefresh effect re-syncs the URL from the merged list
    await waitFor(() => expect(mocked).toHaveBeenCalled());
    const lastCall = mocked.mock.calls.at(-1);
    expect(lastCall?.[2].map((i: CountryContestant) => i.uid)).toEqual(['a', 'b', 'c']);
  });
});
