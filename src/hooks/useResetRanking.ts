import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from './stateHooks';
import { CountryContestant } from '../data/CountryContestant';
import {
  setContestants,
  setRankedItems,
  setUnrankedItems,
  setSelectedContestants,
} from '../redux/rootSlice';
import { AppState } from '../redux/store';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { clearAllRankingParams, updateUrlFromRankedItems } from '../utilities/UrlUtil';

export const useResetRanking = () => {
  const dispatch = useAppDispatch();
  const year = useAppSelector((state: AppState) => state.root.year);
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);

  const refreshUrl = () => {
    updateUrlFromRankedItems(activeCategory, categories, []);
  };

  const resetRanking = useCallback(async () => {
    const yearContestants: CountryContestant[] = await fetchCountryContestantsByYear(year, '');

    dispatch(setContestants(yearContestants));
    dispatch(setUnrankedItems(yearContestants));
    dispatch(setRankedItems([]));
    dispatch(setSelectedContestants([]));

    clearAllRankingParams(categories);
    refreshUrl();
  }, [dispatch, year, categories]);

  return resetRanking;
};
