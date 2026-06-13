// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useRefreshUrl } from './useRefreshUrl';
import { Category } from '../utilities/CategoryUtil';
import { CountryContestant } from '../data/CountryContestant';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

const cc = (id: string): CountryContestant =>
  ({ id, uid: id, country: { id, key: id, name: id }, contestant: null }) as CountryContestant;

const cat = (name: string) => ({ name }) as Category;

describe('useRefreshUrl', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('appends every unranked contestant to the ranking and empties the unranked list', () => {
    const store = makeTestStore({
      root: {
        categoryRankings: [[cc('a')]],
        unrankedItems: [cc('b'), cc('c')],
        categories: [cat('c1')],
      },
    });

    const { result } = renderHook(() => useRefreshUrl(), { wrapper: storeWrapper(store) });

    act(() => {
      result.current.handleAddAllUnranked();
    });

    expect(selectActiveRankedItems(store.getState()).map((i) => i.uid)).toEqual(['a', 'b', 'c']);
    expect(store.getState().root.unrankedItems).toHaveLength(0);
  });

  it('adds the unranked contestants to every category ranking, not just the active one', () => {
    const store = makeTestStore({
      root: {
        categoryRankings: [[cc('a')], [cc('a')]],
        unrankedItems: [cc('b')],
        categories: [cat('c1'), cat('c2')],
        activeCategory: 0,
      },
    });

    const { result } = renderHook(() => useRefreshUrl(), { wrapper: storeWrapper(store) });

    act(() => {
      result.current.handleAddAllUnranked();
    });

    const rankings = store.getState().root.categoryRankings;
    expect(rankings[0].map((i) => i.uid)).toEqual(['a', 'b']);
    expect(rankings[1].map((i) => i.uid)).toEqual(['a', 'b']);
  });
});
