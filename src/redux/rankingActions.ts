import { createAsyncThunk } from '@reduxjs/toolkit';

import { setRankedItems, setUnrankedItems, removeCountryFromCategories } from './rootSlice';
import { AppState } from './store';
import { CountryContestant } from '../data/CountryContestant';
import { removeCountryFromUrlCategoryRankings } from '../utilities/CategoryUtil';

export const deleteRankedCountry = createAsyncThunk(
  'rankings/deleteRankedCountry',
  async (id: string, { getState, dispatch }) => {
    const state = getState() as AppState;

    const { categoryRankings, activeCategory, unrankedItems, categories } = state.root;
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
    // one) so tab switches reflect the deletion without re-reading the URL
    dispatch(removeCountryFromCategories(id));

    // remove the country from each category ranking in the URL parameters
    removeCountryFromUrlCategoryRankings(categories, id);

    return { id };
  },
);
