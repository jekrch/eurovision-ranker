import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './stateHooks';
import { setContestants, setRankedItems, setUnrankedItems, setSelectedContestants } from '../redux/rootSlice';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { clearAllRankingParams, updateUrlFromRankedItems } from '../utilities/UrlUtil';
import { AppState } from '../redux/store';
import { CountryContestant } from '../data/CountryContestant';

export const useResetRanking = () => {
  const dispatch = useAppDispatch();
  const year = useAppSelector((state: AppState) => state.year);
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);

  const refreshUrl = () => {
    updateUrlFromRankedItems(
        activeCategory, categories, []
    );
  }

  const resetRanking = useCallback(async () => {
    let yearContestants: CountryContestant[] = await fetchCountryContestantsByYear(year, '');

    dispatch(setContestants(yearContestants));
    dispatch(setUnrankedItems(yearContestants));
    dispatch(setRankedItems([]));
    dispatch(setSelectedContestants([]));

    clearAllRankingParams(categories);
    refreshUrl();

  }, [dispatch, year, categories]);

  return resetRanking;
};