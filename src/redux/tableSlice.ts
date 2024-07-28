import { createAsyncThunk } from '@reduxjs/toolkit';
import { AppState } from './store';

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