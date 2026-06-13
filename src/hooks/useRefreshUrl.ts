import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from './stateHooks';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import {
  setRankedItems,
  setUnrankedItems,
  appendCountriesToOtherCategories,
} from '../redux/rootSlice';
import { AppState } from '../redux/store';

export const useRefreshUrl = () => {
  const dispatch = useAppDispatch();
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);

  // Move every unranked contestant into the ranking, for the active category and
  // every other category's store slot. The single URL writer projects the result.
  const handleAddAllUnranked = useCallback(() => {
    const newRankedItems = [...rankedItems, ...unrankedItems];
    dispatch(setRankedItems(newRankedItems));
    dispatch(appendCountriesToOtherCategories(unrankedItems));
    dispatch(setUnrankedItems([]));
  }, [dispatch, rankedItems, unrankedItems]);

  return { handleAddAllUnranked };
};
