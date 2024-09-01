import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from './stateHooks';
import { updateUrlFromRankedItems } from '../utilities/UrlUtil';
import { AppState } from '../redux/store';
import { setRankedItems, setUnrankedItems } from '../redux/rootSlice';

export const useRefreshUrl = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.unrankedItems);
  const [shouldRefresh, setShouldRefresh] = useState(false);

  const refreshUrl = useCallback(() => {
    //console.log('Refreshing URL with:', rankedItems);
    updateUrlFromRankedItems(
      activeCategory, 
      categories, 
      rankedItems
    );
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
    dispatch(setUnrankedItems([]));

    // Update URL parameters
    if (categories.length > 0) {
      const searchParams = new URLSearchParams(window.location.search);

      categories.forEach((_, index) => {
        const categoryParam = `r${index + 1}`;
        const currentRanking = searchParams.get(categoryParam) || '';
        const updatedRanking = `${currentRanking}${unrankedItems.map(item => item.country.id).join('')}`;
        searchParams.set(categoryParam, updatedRanking);
      });

      const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }

    setShouldRefresh(true);
  }, [dispatch, rankedItems, unrankedItems, categories]);

  return { refreshUrl, handleAddAllUnranked  };
};