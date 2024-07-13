import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CountryContestant } from '../data/CountryContestant';
import { Category } from '../utilities/CategoryUtil';
import { ContestantVotes } from '../data/Vote';
import { updateQueryParams } from '../utilities/UrlUtil';

interface AppState {
    name: string;
    year: string;
    theme: string;
    vote: string;
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
}

const initialState: AppState = {
    name: '',
    year: '',
    theme: '',
    vote: 'loading',
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
        assignVotesToContestants: (state, action: PayloadAction<{ voteSums: { [key: string]: ContestantVotes; } }>) => {
            const { voteSums } = action.payload;

            let newContestants = JSON.parse(JSON.stringify(state.contestants))

            newContestants.forEach((cc: CountryContestant) => {
                if (cc.contestant) {
                    cc.contestant.votes = voteSums[cc.country.key] || undefined;
                }
            });

            state.contestants = newContestants;

            let newRankedItems = JSON.parse(JSON.stringify(state.rankedItems))

            newRankedItems.forEach((cc: CountryContestant) => {
                if (!cc?.contestant) return;
                cc.contestant.votes = voteSums[cc.country.key] || undefined;
            });

            state.rankedItems = newRankedItems;

            let newUnrankedItems = JSON.parse(JSON.stringify(state.unrankedItems))

            newUnrankedItems.forEach((cc: CountryContestant) => {
                if (!cc?.contestant) return;
                cc.contestant.votes = voteSums[cc.country.key] || undefined;
            });

            state.unrankedItems = newUnrankedItems;
        },
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
    assignVotesToContestants
} = rootSlice.actions;

export default rootSlice.reducer;