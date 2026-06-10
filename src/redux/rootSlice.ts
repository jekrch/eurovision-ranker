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
  rankedItems: CountryContestant[];
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
  rankedItems: [],
  unrankedItems: [],
  categories: [],
  activeCategory: undefined,
  showTotalRank: false,
  showComparison: false,
  showThumbnail: true,
  showPlace: false,
  welcomeOverlayIsOpen: false,
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

      state.rankedItems = assignVotes(clone(state.rankedItems), votes);

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
