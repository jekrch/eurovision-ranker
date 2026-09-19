import { useCallback } from 'react';
import { useStore } from 'react-redux';

import { useAppDispatch } from './stateHooks';
import { CountryContestant } from '../data/CountryContestant';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import {
  setRankedItems,
  setUnrankedItems,
  appendCountriesToOtherCategories,
} from '../redux/rootSlice';
import { AppState } from '../redux/store';

export const useRefreshUrl = () => {
  const dispatch = useAppDispatch();
  const store = useStore<AppState>();

  // Move every unranked contestant into the ranking, for the active category and
  // every other category's store slot. The single URL writer projects the result.
  // The lists are read when this runs rather than when it was created: Add All
  // lets the selection column animate out first, and the ranking can change in
  // the meantime.
  //
  // It's two steps so Add All can overlap them: the ranking takes the countries
  // while the selection column's rows are still on their way out, and the
  // column lets them go once they're gone (see useBulkMove).
  const rankAllUnranked = useCallback(() => {
    const state = store.getState();
    const unrankedItems = state.root.unrankedItems;
    dispatch(setRankedItems([...selectActiveRankedItems(state), ...unrankedItems]));
    dispatch(appendCountriesToOtherCategories(unrankedItems));
    return unrankedItems;
  }, [dispatch, store]);

  // Takes only the moved countries out, so one returned to the selection column
  // in between isn't lost with them.
  const removeFromUnranked = useCallback(
    (moved: CountryContestant[]) => {
      const movedIds = new Set(moved.map((item) => item.id));
      const unrankedItems = store.getState().root.unrankedItems;
      dispatch(setUnrankedItems(unrankedItems.filter((item) => !movedIds.has(item.id))));
    },
    [dispatch, store],
  );

  const handleAddAllUnranked = useCallback(
    () => removeFromUnranked(rankAllUnranked()),
    [rankAllUnranked, removeFromUnranked],
  );

  return { handleAddAllUnranked, rankAllUnranked, removeFromUnranked };
};
