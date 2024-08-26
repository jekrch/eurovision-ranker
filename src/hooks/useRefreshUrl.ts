import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './stateHooks';
import {  updateUrlFromRankedItems } from '../utilities/UrlUtil';
import { AppState } from '../redux/store';

export const useRefreshUrl = () => {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);

  const refreshUrl = useCallback(async () => {
    updateUrlFromRankedItems(
        activeCategory, categories, rankedItems
    );
  }, [dispatch, activeCategory, categories, rankedItems]);

  return refreshUrl;
}
