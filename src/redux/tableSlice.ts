import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { AppState } from './store';
import { setRankedItems, setUnrankedItems } from './rootSlice';
import { ContestantRow, TableState } from '../components/table/tableTypes';

export interface TableSliceState {
    tableState: TableState;
}

const initialState: TableSliceState = {
    tableState: {
        sortColumn: 'year',
        sortDirection: 'desc',
        filters: {},
        pageSize: 10,
        currentPage: 1,
        filteredEntries: [],
        entries: [],
        searchTerm: '',
        selectedContestants: [],
        paginatedContestants: []
    } as TableState
};

export const sortTable = createAsyncThunk(
  'table/sortTable',
  async (column: string, { getState }) => {
    const state = getState() as AppState;
    const currentSort = state.table.tableState.sortColumn;
    const currentDirection = state.table.tableState.sortDirection;

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
    const { rankedItems, unrankedItems, categories } = state.root;

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

const tableSlice = createSlice({
    name: 'table',
    initialState,
    reducers: {
        setTableCurrentPage: (state, action: PayloadAction<number>) => {
            state.tableState.currentPage = action.payload;
        },
        setEntries: (state, action: PayloadAction<ContestantRow[]>) => {
            state.tableState.entries = action.payload;
        },
        setSelectedContestants: (state, action: PayloadAction<ContestantRow[]>) => {
            state.tableState.selectedContestants = action.payload;
        },
        setPaginatedContestants: (state, action: PayloadAction<ContestantRow[]>) => {
            state.tableState.paginatedContestants = action.payload;
        },
        toggleSelectedContestant: (state, action: PayloadAction<string>) => {
            const contestantId = action.payload;
            const index = state.tableState.selectedContestants.findIndex(c => c.id === contestantId);
            if (index !== -1) {
                state.tableState.selectedContestants.splice(index, 1);
            } else {
                const contestant = state.tableState.entries.find(c => c.id === contestantId);
                if (contestant) {
                    state.tableState.selectedContestants.push(contestant);
                }
            }
        },
        addAllPaginatedContestants: (state) => {
            const newSelectedContestants = state.tableState.paginatedContestants.filter(
                paginatedContestant => !state.tableState.selectedContestants.some(
                    selectedContestant => selectedContestant.id === paginatedContestant.id
                )
            );

            state.tableState.selectedContestants = [
                ...state.tableState.selectedContestants,
                ...newSelectedContestants
            ];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(sortTable.fulfilled, (state, action) => {
                state.tableState.sortColumn = action.payload.column;
                state.tableState.sortDirection = action.payload.direction;
            })
            .addCase(filterTable.fulfilled, (state, action) => {
                state.tableState.filters = action.payload;
                state.tableState.currentPage = 1; // Reset to first page when filters change
            })
            .addCase(changePageSize.fulfilled, (state, action) => {
                state.tableState.pageSize = action.payload;
                state.tableState.currentPage = 1; // Reset to first page when page size changes
            });
    },
});

export const {
    setTableCurrentPage,
    setEntries,
    setSelectedContestants,
    setPaginatedContestants,
    toggleSelectedContestant,
    addAllPaginatedContestants,
} = tableSlice.actions;

export default tableSlice.reducer;
