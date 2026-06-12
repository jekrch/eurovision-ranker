import { useCallback, useEffect, useState } from 'react';

import { useAppDispatch, useAppSelector } from './stateHooks';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import {
  setRankedItems,
  setUnrankedItems,
  appendCountriesToOtherCategories,
} from '../redux/rootSlice';
import { AppState } from '../redux/store';
import { updateUrlFromRankedItems } from '../utilities/UrlUtil';

export const useRefreshUrl = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const refreshUrl = useCallback(() => {
    updateUrlFromRankedItems(activeCategory, categories, rankedItems);
  }, [activeCategory, categories, rankedItems]);

  useEffect(() => {
    if (shouldRefresh) {
      refreshUrl();
      setShouldRefresh(false);
    }
  }, [shouldRefresh, refreshUrl]);

  const handleAddAllUnranked = useCallback(() => {
    const newRankedItems = [...rankedItems, ...unrankedItems];
    dispatch(setRankedItems(newRankedItems));
    dispatch(appendCountriesToOtherCategories(unrankedItems));
    dispatch(setUnrankedItems([]));

    // Update URL parameters
    if (categories.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);

      categories.forEach((_, index) => {
        const categoryParam = `r${index + 1}`;
        const currentRanking = searchParams.get(categoryParam) || '';
        const updatedRanking = `${currentRanking}${unrankedItems.map((item) => item.country.id).join('')}`;
        searchParams.set(categoryParam, updatedRanking);
      });

      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }

    setShouldRefresh(true);
  }, [dispatch, rankedItems, unrankedItems, categories]);

  return { refreshUrl, handleAddAllUnranked };
};
