import { useCallback } from 'react';

import { useAppDispatch, useAppSelector } from './stateHooks';
import { CountryContestant } from '../data/CountryContestant';
import {
  setContestants,
  setRankedItems,
  setUnrankedItems,
  setSelectedContestants,
  clearAllCategoryRankings,
} from '../redux/rootSlice';
import { AppState } from '../redux/store';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';

export const useResetRanking = () => {
  const dispatch = useAppDispatch();
  const year = useAppSelector((state: AppState) => state.root.year);

  const resetRanking = useCallback(async () => {
    const yearContestants: CountryContestant[] = await fetchCountryContestantsByYear(year, '');

    dispatch(setContestants(yearContestants));
    dispatch(setUnrankedItems(yearContestants));
    dispatch(setRankedItems([]));
    dispatch(clearAllCategoryRankings());
    dispatch(setSelectedContestants([]));
    // The cleared rankings are projected to the URL by the single URL writer.
  }, [dispatch, year]);

  return resetRanking;
};

/**
 * Puts every one of the year's contestants back in the selection column and
 * leaves the ranking alone. Clear runs it while the ranked rows are still
 * leaving, so the selection column refills alongside them rather than after;
 * the reset that follows finishes the job.
 */
export const useRefillUnranked = () => {
  const dispatch = useAppDispatch();
  const year = useAppSelector((state: AppState) => state.root.year);

  return useCallback(async () => {
    const yearContestants: CountryContestant[] = await fetchCountryContestantsByYear(year, '');
    dispatch(setUnrankedItems(yearContestants));
  }, [dispatch, year]);
};
