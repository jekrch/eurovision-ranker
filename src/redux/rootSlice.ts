import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CountryContestant } from '../data/CountryContestant';
import { Category } from '../utilities/CategoryUtil';
import { ContestantVotes, Vote } from '../data/Vote';
import { assignVotes } from '../utilities/VoteUtil';
import { clone } from '../utilities/ContestantUtil';
import { ContestantRow, TableState } from '../components/table/tableTypes';
import { changePageSize, filterTable, sortTable } from './tableSlice';

interface AppState {
    name: string;
    year: string;
    theme: string;
    vote: string;
    globalSearch: boolean;
    showUnranked: boolean;
    isDeleteMode: boolean;
    headerMenuOpen: boolean;
    contestants: CountryContestant[];
    rankedItems: CountryContestant[];
    unrankedItems: CountryContestant[];
    categories: Category[];
    activeCategory: number | undefined;
    showTotalRank: boolean;
    showComparison: boolean;
    tableState: TableState,
    welcomeOverlayIsOpen: boolean;
}

const initialState: AppState = {
    name: '',
    year: '',
    theme: '',
    vote: 'loading',
    globalSearch: false,
    showUnranked: false,
    isDeleteMode: false,
    headerMenuOpen: false,
    contestants: [],
    rankedItems: [],
    unrankedItems: [],
    categories: [],
    activeCategory: undefined,
    showTotalRank: false,
    showComparison: false,
    welcomeOverlayIsOpen: false,
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

const rootSlice = createSlice({
    name: 'root',
    initialState,
    reducers: {
        setName: (state, action: PayloadAction<string>) => {
            state.name = action.payload;
        },
        setYear: (state, action: PayloadAction<string>) => {
            state.year = action.payload;
        },
        setTheme: (state, action: PayloadAction<string>) => {
            state.theme = action.payload;
        },
        setVote: (state, action: PayloadAction<string>) => {
            state.vote = action.payload;
        },
        setShowUnranked: (state, action: PayloadAction<boolean>) => {
            state.showUnranked = action.payload;
        },
        setIsDeleteMode: (state, action: PayloadAction<boolean>) => {
            state.isDeleteMode = action.payload;
        },
        setHeaderMenuOpen: (state, action: PayloadAction<boolean>) => {
            state.headerMenuOpen = action.payload;
        },
        setWelcomeOverlayIsOpen: (state, action: PayloadAction<boolean>) => {
            state.welcomeOverlayIsOpen = action.payload;
        },
        setRankedItems: (state, action: PayloadAction<CountryContestant[]>) => {
            state.rankedItems = action.payload;
        },
        setUnrankedItems: (state, action: PayloadAction<CountryContestant[]>) => {
            state.unrankedItems = action.payload;
        },
        setContestants: (state, action: PayloadAction<CountryContestant[]>) => {
            state.contestants = action.payload;
        },
        setCategories: (state, action: PayloadAction<Category[]>) => {
            state.categories = action.payload;
        },
        setActiveCategory: (state, action: PayloadAction<number | undefined>) => {
            state.activeCategory = action.payload;
        },
        setShowTotalRank: (state, action: PayloadAction<boolean>) => {
            state.showTotalRank = action.payload;
        },
        setShowComparison: (state, action: PayloadAction<boolean>) => {
            state.showComparison = action.payload;
        },
        setGlobalSearch: (state, action: PayloadAction<boolean>) => {
            state.globalSearch = action.payload;
        },
        assignVotesToContestants: (state, action: PayloadAction<Vote[]>) => {
            const votes: Vote[] = action.payload;

            state.contestants = assignVotes(
                clone(state.contestants), votes
            );

            state.rankedItems = assignVotes(
                clone(state.rankedItems), votes
            );
            
            state.unrankedItems = assignVotes(
                clone(state.unrankedItems), votes
            );
        },
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
        /**
         * Add all paginatedContestants that are not already selected
         * @param state 
         */
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
    setName,
    setYear,
    setTheme,
    setVote,
    setShowUnranked,
    setIsDeleteMode,
    setHeaderMenuOpen,
    setRankedItems,
    setUnrankedItems,
    setContestants,
    setCategories,
    setActiveCategory,
    setShowTotalRank,
    setShowComparison,
    assignVotesToContestants,
    setTableCurrentPage,
    setEntries,
    toggleSelectedContestant,
    setSelectedContestants,
    setPaginatedContestants,
    addAllPaginatedContestants,
    setGlobalSearch,
    setWelcomeOverlayIsOpen
} = rootSlice.actions;

export default rootSlice.reducer;