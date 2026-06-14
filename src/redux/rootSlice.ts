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
  // Public-view-by-id mode. While 'public' the app is showing a ranking loaded
  // from a `?id=<publicViewId>` share link, and the single URL writer projects
  // just that id (the rest of the state is hidden from the URL). The first
  // genuine user edit flips this back to 'normal' — a reducer concern, not an
  // effect comparing the loaded value to the current one — after which the writer
  // projects the full param set and drops the id.
  viewMode: 'normal' | 'public';
  publicViewId: string | undefined;
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
  viewMode: 'normal',
  publicViewId: undefined,
};

// The categoryRankings slot backing the currently displayed list. When no
// category is active (undefined) the single ranking lives in slot 0.
const activeIndex = (state: AppState): number => state.activeCategory ?? 0;

// A genuine user edit leaves public-view mode, so the tidy `?id=` share URL
// gives way to the full projected state. The boot/load sequence dispatches these
// same reducers to hydrate the shared ranking, but it does so *before*
// enterPublicView runs (mode is still 'normal' then), so this is a no-op for it
// and only fires on a real post-load edit.
const leavePublicView = (state: AppState): void => {
  if (state.viewMode === 'public') {
    state.viewMode = 'normal';
    state.publicViewId = undefined;
  }
};

const rootSlice = createSlice({
  name: 'root',
  initialState,
  reducers: {
    setName: (state, action: PayloadAction<string>) => {
      state.name = action.payload;
      leavePublicView(state);
    },
    setYear: (state, action: PayloadAction<string>) => {
      state.year = action.payload;
      leavePublicView(state);
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
      leavePublicView(state);
    },
    // Replace every category's ranking at once — used by the boot parse to seed
    // the store with all per-category orders from the URL.
    setCategoryRankings: (state, action: PayloadAction<CountryContestant[][]>) => {
      state.categoryRankings = action.payload.length ? action.payload : [[]];
    },
    // Set the active category's order AND bring every other category to the same
    // membership in one atomic, idempotent step: each other slot keeps its own
    // order for contestants still present, drops any no longer in the ranking,
    // and gains (at the end) any it was missing. Used by the advanced view, where
    // selecting/deselecting changes which contestants are ranked across all
    // categories. Idempotent so it can be re-applied by a re-running effect
    // without drifting (the non-idempotent append/remove pair it replaced could
    // duplicate entries and never settle, storming the URL writer).
    setActiveRankingAndSyncCategoryMembership: (
      state,
      action: PayloadAction<CountryContestant[]>,
    ) => {
      const membership = action.payload;
      const active = activeIndex(state);
      state.categoryRankings[active] = membership;
      leavePublicView(state);

      const keyOf = (item: CountryContestant) => (state.globalSearch ? item.uid : item.id);
      const membershipKeys = new Set(membership.map(keyOf));

      const slotCount = Math.max(state.categories.length, state.categoryRankings.length);
      for (let i = 0; i < slotCount; i++) {
        if (i === active) continue;
        const slot = state.categoryRankings[i] ?? [];
        const kept = slot.filter((item) => membershipKeys.has(keyOf(item)));
        const keptKeys = new Set(kept.map(keyOf));
        const additions = membership.filter((item) => !keptKeys.has(keyOf(item)));
        state.categoryRankings[i] = [...kept, ...additions];
      }
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
      leavePublicView(state);
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
      leavePublicView(state);
    },
    // Remove a country from every category ranking (delete from the ranking).
    removeCountryFromCategories: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.categoryRankings = state.categoryRankings.map((ranking) =>
        ranking.filter((item) => item.id !== id && item.uid !== id),
      );
      leavePublicView(state);
    },
    // Clear every category ranking (reset).
    clearAllCategoryRankings: (state) => {
      state.categoryRankings = state.categoryRankings.length
        ? state.categoryRankings.map(() => [])
        : [[]];
      leavePublicView(state);
    },
    // Ensure a ranking slot exists for each of `count` categories. Newly created
    // slots inherit the currently active ranking, mirroring how defining a
    // category historically started it from the current order. Existing slots
    // keep their order.
    seedCategoryRankingSlots: (state, action: PayloadAction<number>) => {
      const count = action.payload;
      const source = state.categoryRankings[activeIndex(state)] ?? [];
      for (let i = 0; i < count; i++) {
        if (!state.categoryRankings[i]) {
          state.categoryRankings[i] = clone(source);
        }
      }
    },
    // Remove a single category's ranking slot (category delete). Remaining slots
    // shift down to stay index-aligned with `categories`.
    removeCategoryRankingSlot: (state, action: PayloadAction<number>) => {
      state.categoryRankings.splice(action.payload, 1);
      if (!state.categoryRankings.length) {
        state.categoryRankings = [[]];
      }
    },
    // Collapse every category's ranking down to the single ranking held in the
    // given slot (category clear): the chosen order becomes the sole, category-
    // less ranking.
    collapseCategoryRankingsToSlot: (state, action: PayloadAction<number>) => {
      const keep =
        state.categoryRankings[action.payload] ??
        state.categoryRankings.find((ranking) => ranking.length) ??
        [];
      state.categoryRankings = [clone(keep)];
    },
    // Replace one category's ranking slot (used when importing a specific order
    // into a freshly added category, e.g. the analyze comparison).
    setCategoryRankingAtSlot: (
      state,
      action: PayloadAction<{ index: number; ranking: CountryContestant[] }>,
    ) => {
      const { index, ranking } = action.payload;
      state.categoryRankings[index] = ranking;
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
    // Enter public-view-by-id mode. Dispatched as the last step of loading a
    // shared ranking, after the name/year/ranking have been hydrated, so those
    // hydrating dispatches don't trip leavePublicView. The single URL writer then
    // projects just `?id=<id>`.
    enterPublicView: (state, action: PayloadAction<string>) => {
      state.viewMode = 'public';
      state.publicViewId = action.payload;
    },
    // Leave public-view mode explicitly (e.g. a failed load). User edits leave it
    // implicitly via leavePublicView; this is for the non-edit exits.
    exitPublicView: (state) => {
      state.viewMode = 'normal';
      state.publicViewId = undefined;
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
  setActiveRankingAndSyncCategoryMembership,
  addCountryToOtherCategories,
  appendCountriesToOtherCategories,
  removeCountryFromCategories,
  clearAllCategoryRankings,
  seedCategoryRankingSlots,
  removeCategoryRankingSlot,
  collapseCategoryRankingsToSlot,
  setCategoryRankingAtSlot,
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
  enterPublicView,
  exitPublicView,
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
