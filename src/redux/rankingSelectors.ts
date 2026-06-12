import { createSelector } from '@reduxjs/toolkit';

import { AppState } from './store';
import { CountryContestant } from '../data/CountryContestant';
import { reorderByStoreCategoryRankings } from '../utilities/CategoryUtil';

const EMPTY: CountryContestant[] = [];

/**
 * The list currently displayed in the ranking column, derived from the store
 * alone — never the URL. It is either the active category's order, or, on the
 * Total tab, the weighted aggregation of every category's order.
 *
 * This replaces the old `state.root.rankedItems` field: the store now holds all
 * per-category orders (categoryRankings) and the displayed list is a pure
 * projection of them, so switching tabs is a plain activeCategory change with
 * no URL read or reload.
 */
export const selectActiveRankedItems = createSelector(
  [
    (state: AppState) => state.root.categoryRankings,
    (state: AppState) => state.root.activeCategory,
    (state: AppState) => state.root.showTotalRank,
    (state: AppState) => state.root.categories,
    (state: AppState) => state.root.globalSearch,
  ],
  (categoryRankings, activeCategory, showTotalRank, categories, globalSearch) => {
    if (showTotalRank) {
      return reorderByStoreCategoryRankings(categories, categoryRankings, globalSearch);
    }
    return categoryRankings[activeCategory ?? 0] ?? EMPTY;
  },
);
