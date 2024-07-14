import { createAsyncThunk } from '@reduxjs/toolkit';
import { CountryContestant } from '../data/CountryContestant';
import { setRankedItems, setUnrankedItems } from './rootSlice';
import { AppState } from './store';
import { removeCountryFromUrlCategoryRankings } from '../utilities/CategoryUtil';

export const deleteRankedCountry = createAsyncThunk(
  'rankings/deleteRankedCountry',
  async (id: string, { getState, dispatch }) => {
    const state = getState() as AppState;

    const { rankedItems, unrankedItems, categories } = state;

    const index = rankedItems.findIndex(i => i.id === id);
    if (index === -1) throw new Error('Country not found in ranked items');

    const objectToMove = rankedItems[index];
    const newRankedItems = rankedItems.filter((item: CountryContestant) => item.id !== id);

    const insertionIndex = unrankedItems.findIndex(
      i => i.country.name > objectToMove.country.name
    );

    const newUnrankedItems = insertionIndex === -1
      ? [...unrankedItems, objectToMove]
      : [
          ...unrankedItems.slice(0, insertionIndex),
          objectToMove,
          ...unrankedItems.slice(insertionIndex)
        ];

    dispatch(setRankedItems(newRankedItems));
    dispatch(setUnrankedItems(newUnrankedItems));

    // remove the country from each category ranking in the URL parameters
    removeCountryFromUrlCategoryRankings(categories, id);

    return { id };
  }
);