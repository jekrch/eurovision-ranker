import { createAsyncThunk } from '@reduxjs/toolkit';

import {
  setRankedItems,
  setUnrankedItems,
  removeCountryFromCategories,
  setContestants,
  setCategoryRankings,
} from './rootSlice';
import { AppState } from './store';
import { CountryContestant } from '../data/CountryContestant';
import { fetchCountryContestantsByYear } from '../utilities/ContestantRepository';
import { encodeRankingsToURL, orderContestantsByRankingStr } from '../utilities/UrlUtil';

export const deleteRankedCountry = createAsyncThunk(
  'rankings/deleteRankedCountry',
  async (id: string, { getState, dispatch }) => {
    const state = getState() as AppState;

    const { categoryRankings, activeCategory, unrankedItems } = state.root;
    const rankedItems = categoryRankings[activeCategory ?? 0] ?? [];

    const index = rankedItems.findIndex((i) => i.id === id);
    if (index === -1) throw new Error('Country not found in ranked items');

    const objectToMove = rankedItems[index];
    const newRankedItems = rankedItems.filter((item: CountryContestant) => item.id !== id);

    const insertionIndex = unrankedItems.findIndex(
      (i) => i.country.name > objectToMove.country.name,
    );

    const newUnrankedItems =
      insertionIndex === -1
        ? [...unrankedItems, objectToMove]
        : [
            ...unrankedItems.slice(0, insertionIndex),
            objectToMove,
            ...unrankedItems.slice(insertionIndex),
          ];

    dispatch(setRankedItems(newRankedItems));
    dispatch(setUnrankedItems(newUnrankedItems));

    // remove the country from every category's store slot (not just the active
    // one) so tab switches reflect the deletion. The single URL writer projects
    // the updated rankings back to the URL.
    dispatch(removeCountryFromCategories(id));

    return { id };
  },
);

/**
 * Re-resolve every category's ranking against a newly selected year. The ranked
 * countries are stable across years (the same country ids), so each slot keeps
 * its order; only the underlying contestant data (song / artist / vote) is
 * refreshed for the new year. The store is the source of truth — the rankings
 * are read from the store, never the URL — and the single URL writer projects
 * the refreshed result back out.
 */
export const reloadRankingsForYear = createAsyncThunk(
  'rankings/reloadRankingsForYear',
  async (year: string, { getState, dispatch }) => {
    const state = getState() as AppState;
    const { categoryRankings, activeCategory, globalSearch, vote } = state.root;

    const voteCode = vote && vote !== 'loading' ? vote : '';

    let yearContestants: CountryContestant[] | undefined;
    if (!globalSearch) {
      yearContestants = await fetchCountryContestantsByYear(year, voteCode);
      dispatch(setContestants(yearContestants));
    }

    const activeSlot = activeCategory ?? 0;
    const refreshed: CountryContestant[][] = [];
    let activeRankedIds: string[] = [];

    for (let i = 0; i < categoryRankings.length; i++) {
      const rankingStr = encodeRankingsToURL(categoryRankings[i] ?? [], globalSearch);
      const { rankedIds, rankedCountries } = await orderContestantsByRankingStr(
        rankingStr,
        yearContestants,
        globalSearch,
        voteCode,
      );
      refreshed[i] = rankedCountries;
      if (i === activeSlot) {
        activeRankedIds = rankedIds;
      }
    }

    dispatch(setCategoryRankings(refreshed));

    if (globalSearch) {
      dispatch(setUnrankedItems([]));
    } else {
      const unranked = yearContestants?.filter((c) => !activeRankedIds.includes(c.id)) ?? [];
      dispatch(setUnrankedItems(unranked));
    }

    return { year };
  },
);
