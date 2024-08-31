import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppState } from './store';
import { setRankedItems, setUnrankedItems } from './rootSlice';

export const sortTable = createAsyncThunk(
  'table/sortTable',
  async (column: string, { getState }) => {
    const state = getState() as AppState;
    const currentSort = state.tableState.sortColumn;
    const currentDirection = state.tableState.sortDirection;

    let newDirection = 'asc';
    if (column === currentSort) {
      newDirection = currentDirection === 'asc' ? 'desc' : 'asc';
    }

    return { column, direction: newDirection };
  }
);

export const filterTable = createAsyncThunk(
    'table/filterTable',
    async (filters: Record<string, string | number>, { getState }) => {
      return filters;
    }
  );

export const changePageSize = createAsyncThunk(
  'table/changePageSize',
  async (size: number, { getState }) => {
    return size;
  }
);

export const addAllUnranked = createAsyncThunk(
  'items/addAllUnranked',
  async (_, { dispatch, getState }) => {
    const state = getState() as AppState;
    const { rankedItems, unrankedItems, categories } = state;

    // Clear unranked items
    dispatch(setUnrankedItems([]));

    // Update ranked items
    dispatch(setRankedItems(rankedItems.concat(unrankedItems)));

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

    // Return the updated state for potential use in the reducer
    return {
      rankedItems: rankedItems.concat(unrankedItems),
      unrankedItems: []
    };
  }
);