import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { CountryContestant } from '../data/CountryContestant';
import { Vote } from '../data/Vote';
import { Category } from '../utilities/CategoryUtil';
import { clone } from '../utilities/ContestantUtil';
import { assignVotes } from '../utilities/VoteUtil';

// Core ranking/display state. Auth, table, and groups state now live in their
// own slices (authSlice/tableSlice/groupsSlice); their action creators are
// re-exported below so existing imports from './rootSlice' keep working.
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
  // Per-category rankings; index aligns with `categories` (slot 0 is also the
  // single ranking when no categories are defined). The displayed list is
  // derived from this via selectActiveRankedItems — the store, not the URL, is
  // the source of truth for every category's order.
  categoryRankings: CountryContestant[][];
  unrankedItems: CountryContestant[];
  categories: Category[];
  activeCategory: number | undefined;
  showTotalRank: boolean;
  showComparison: boolean;
  showPlace: boolean;
  showThumbnail: boolean;
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
  categoryRankings: [[]],
  unrankedItems: [],
  categories: [],
  activeCategory: undefined,
  showTotalRank: false,
  showComparison: false,
  showThumbnail: true,
  showPlace: false,
  welcomeOverlayIsOpen: false,
};

// The categoryRankings slot backing the currently displayed list. When no
// category is active (undefined) the single ranking lives in slot 0.
const activeIndex = (state: AppState): number => state.activeCategory ?? 0;

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
      // set the theme on the document root
      // if (action.payload && action.payload !== 'ab') {
      //     document.documentElement.setAttribute('data-theme', action.payload);
      // } else {
      //     document.documentElement.setAttribute('data-theme', THEME_OPTIONS.find(t => t.default)?.code || '');
      // }

      // // Update iOS safe area colors
      // const color = action.payload?.length ? THEME_SURFACE_COLORS[action.payload] : THEME_SURFACE_COLORS[THEME_OPTIONS.find(t => t.default)?.code || ''];
      // document.body.style.backgroundColor = color;
      // const meta = document.querySelector('meta[name="theme-color"]');
      // if (meta) {
      //     meta.setAttribute('content', color);
      // }
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
    // Replace the active category's ranking. Components dispatch this exactly as
    // before; it now writes the active slot of categoryRankings rather than a
    // standalone array. The active slot is activeCategory (or 0 when no category
    // is selected / none are defined).
    setRankedItems: (state, action: PayloadAction<CountryContestant[]>) => {
      state.categoryRankings[activeIndex(state)] = action.payload;
    },
    // Replace every category's ranking at once — used by the boot parse to seed
    // the store with all per-category orders from the URL.
    setCategoryRankings: (state, action: PayloadAction<CountryContestant[][]>) => {
      state.categoryRankings = action.payload.length ? action.payload : [[]];
    },
    // Append a newly-ranked country to the inactive categories. The active
    // category receives the country (possibly at a chosen position) via
    // setRankedItems; the others just gain it at the end, mirroring the
    // historical per-category URL behavior.
    addCountryToOtherCategories: (state, action: PayloadAction<CountryContestant>) => {
      const active = activeIndex(state);
      const slotCount = Math.max(state.categories.length, state.categoryRankings.length);
      for (let i = 0; i < slotCount; i++) {
        if (i === active) continue;
        if (!state.categoryRankings[i]) state.categoryRankings[i] = [];
        state.categoryRankings[i].push(action.payload);
      }
    },
    // Append multiple countries to the inactive categories (add-all-unranked).
    appendCountriesToOtherCategories: (state, action: PayloadAction<CountryContestant[]>) => {
      const active = activeIndex(state);
      const slotCount = Math.max(state.categories.length, state.categoryRankings.length);
      for (let i = 0; i < slotCount; i++) {
        if (i === active) continue;
        if (!state.categoryRankings[i]) state.categoryRankings[i] = [];
        state.categoryRankings[i].push(...action.payload);
      }
    },
    // Remove a country from every category ranking (delete from the ranking).
    removeCountryFromCategories: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.categoryRankings = state.categoryRankings.map((ranking) =>
        ranking.filter((item) => item.id !== id && item.uid !== id),
      );
    },
    // Clear every category ranking (reset).
    clearAllCategoryRankings: (state) => {
      state.categoryRankings = state.categoryRankings.length
        ? state.categoryRankings.map(() => [])
        : [[]];
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
    setShowThumbnail: (state, action: PayloadAction<boolean>) => {
      state.showThumbnail = action.payload;
    },
    setShowPlace: (state, action: PayloadAction<boolean>) => {
      state.showPlace = action.payload;
    },
    setGlobalSearch: (state, action: PayloadAction<boolean>) => {
      state.globalSearch = action.payload;
    },
    assignVotesToContestants: (state, action: PayloadAction<Vote[]>) => {
      const votes: Vote[] = action.payload;

      state.contestants = assignVotes(clone(state.contestants), votes);

      state.categoryRankings = state.categoryRankings.map((ranking) =>
        assignVotes(clone(ranking), votes),
      );

      state.unrankedItems = assignVotes(clone(state.unrankedItems), votes);
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
  setCategoryRankings,
  addCountryToOtherCategories,
  appendCountriesToOtherCategories,
  removeCountryFromCategories,
  clearAllCategoryRankings,
  setUnrankedItems,
  setContestants,
  setCategories,
  setActiveCategory,
  setShowTotalRank,
  setShowComparison,
  setShowThumbnail,
  setShowPlace,
  assignVotesToContestants,
  setGlobalSearch,
  setWelcomeOverlayIsOpen,
} = rootSlice.actions;

// Re-export domain-slice actions and types so existing imports from
// './rootSlice' continue to resolve after the store decomposition.
export {
  setAuthStatus,
  setAuthError,
  loginSuccess,
  logout,
  setCurrentRankingId,
  setLastSavedSignature,
  clearCurrentRanking,
  setLoadedAuthor,
  patchUser,
  setSavedRankings,
  upsertSavedRanking,
  removeSavedRanking,
  addGroupIdToRanking,
  removeGroupIdFromRanking,
} from './authSlice';
export type { AuthStatus, LoadedAuthor } from './authSlice';

export {
  setTableCurrentPage,
  setEntries,
  setSelectedContestants,
  setPaginatedContestants,
  toggleSelectedContestant,
  addAllPaginatedContestants,
} from './tableSlice';

export {
  setGroups,
  upsertGroup,
  setGroupDetail,
  removeGroup,
  setGroupInvites,
  addGroupInvite,
  removeGroupInvite,
  setGroupSharedRankings,
} from './groupsSlice';

export default rootSlice.reducer;
