import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CountryContestant } from '../data/CountryContestant';
import { Category } from '../utilities/CategoryUtil';
import { ContestantVotes, Vote } from '../data/Vote';
import { assignVotes } from '../utilities/VoteUtil';
import { clone } from '../utilities/ContestantUtil';
import { ContestantRow, TableState } from '../components/table/tableTypes';
import { changePageSize, filterTable, sortTable } from './tableSlice';
import { THEME_OPTIONS, THEME_SURFACE_COLORS } from '../components/modals/config/DisplayTab';
import { AuthSliceFields, AuthStatus, loadInitialAuth } from './authSlice';
import { AuthUser, Group, GroupInvite, SharedRanking, UserRanking } from '../utilities/api/types';
import { setToken } from '../utilities/api/client';

interface AppState extends AuthSliceFields {
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
    tableState: TableState,
    welcomeOverlayIsOpen: boolean;
    savedRankings: UserRanking[] | null;
    groups: Group[] | null;
    // Per-group detail (members) + invites + shared rankings.
    // Stored separately so the list view stays light and the detail view
    // can be hydrated on demand and reused across modal opens.
    groupDetails: Record<string, Group>;
    groupInvites: Record<string, GroupInvite[]>;
    groupSharedRankings: Record<string, SharedRanking[]>;
    // Author of a ranking loaded by id (share/public link). Set when a ranking
    // is loaded, cleared when the current ranking is reset. Drives the subtle
    // "loaded ranking by <author>" attribution in the header.
    loadedAuthor: LoadedAuthor | null;
}

export interface LoadedAuthor {
    username?: string;
    email?: string;
    userId?: string;
}

const initialAuth = loadInitialAuth();

const initialState: AppState = {
    user: initialAuth.user,
    token: initialAuth.token,
    authStatus: 'idle' as AuthStatus,
    authError: null,
    currentRankingId: null,
    lastSavedSignature: null,
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
    savedRankings: null,
    groups: null,
    groupDetails: {},
    groupInvites: {},
    groupSharedRankings: {},
    loadedAuthor: null,
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
        setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
            state.authStatus = action.payload;
            if (action.payload !== 'error') state.authError = null;
        },
        setAuthError: (state, action: PayloadAction<string | null>) => {
            state.authError = action.payload;
            state.authStatus = action.payload ? 'error' : 'idle';
        },
        loginSuccess: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
            state.token = action.payload.token;
            state.user = action.payload.user;
            state.authStatus = 'idle';
            state.authError = null;
            setToken(action.payload.token);
        },
        logout: (state) => {
            state.token = null;
            state.user = null;
            state.authStatus = 'idle';
            state.authError = null;
            state.currentRankingId = null;
            state.lastSavedSignature = null;
            state.loadedAuthor = null;
            state.savedRankings = null;
            state.groups = null;
            state.groupDetails = {};
            state.groupInvites = {};
            state.groupSharedRankings = {};
            setToken(null);
        },
        setCurrentRankingId: (state, action: PayloadAction<string | null>) => {
            state.currentRankingId = action.payload;
        },
        setLastSavedSignature: (state, action: PayloadAction<string | null>) => {
            state.lastSavedSignature = action.payload;
        },
        clearCurrentRanking: (state) => {
            state.currentRankingId = null;
            state.lastSavedSignature = null;
            state.loadedAuthor = null;
        },
        setLoadedAuthor: (state, action: PayloadAction<LoadedAuthor | null>) => {
            state.loadedAuthor = action.payload;
        },
        patchUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
            if (state.user) {
                state.user = { ...state.user, ...action.payload };
            }
        },
        setSavedRankings: (state, action: PayloadAction<UserRanking[] | null>) => {
            state.savedRankings = action.payload;
        },
        upsertSavedRanking: (state, action: PayloadAction<UserRanking>) => {
            const r = action.payload;
            if (!state.savedRankings) {
                state.savedRankings = [r];
                return;
            }
            const idx = state.savedRankings.findIndex(x => x.ranking_id === r.ranking_id);
            if (idx >= 0) state.savedRankings[idx] = r;
            else state.savedRankings.unshift(r);
        },
        removeSavedRanking: (state, action: PayloadAction<string>) => {
            if (!state.savedRankings) return;
            state.savedRankings = state.savedRankings.filter(
                x => x.ranking_id !== action.payload
            );
        },
        setGroups: (state, action: PayloadAction<Group[] | null>) => {
            state.groups = action.payload;
        },
        upsertGroup: (state, action: PayloadAction<Group>) => {
            const g = action.payload;
            if (!state.groups) {
                state.groups = [g];
            } else {
                const idx = state.groups.findIndex(x => x.id === g.id);
                if (idx >= 0) {
                    // Preserve member_count if the incoming summary doesn't have it
                    // but the cached one does (shouldn't happen, but defensive).
                    state.groups[idx] = { ...state.groups[idx], ...g };
                } else {
                    state.groups.unshift(g);
                }
            }
            if (g.members) {
                state.groupDetails[g.id] = g;
            } else if (state.groupDetails[g.id]) {
                state.groupDetails[g.id] = {
                    ...state.groupDetails[g.id],
                    ...g,
                    members: state.groupDetails[g.id].members,
                };
            }
        },
        setGroupDetail: (state, action: PayloadAction<Group>) => {
            state.groupDetails[action.payload.id] = action.payload;
            // Keep summary in sync.
            if (state.groups) {
                const idx = state.groups.findIndex(x => x.id === action.payload.id);
                const summary: Group = {
                    ...action.payload,
                    members: undefined,
                };
                if (idx >= 0) state.groups[idx] = summary;
                else state.groups.unshift(summary);
            }
        },
        removeGroup: (state, action: PayloadAction<string>) => {
            if (state.groups) {
                state.groups = state.groups.filter(g => g.id !== action.payload);
            }
            delete state.groupDetails[action.payload];
            delete state.groupInvites[action.payload];
            delete state.groupSharedRankings[action.payload];
        },
        setGroupInvites: (state, action: PayloadAction<{ groupId: string; invites: GroupInvite[] }>) => {
            state.groupInvites[action.payload.groupId] = action.payload.invites;
        },
        addGroupInvite: (state, action: PayloadAction<GroupInvite>) => {
            const list = state.groupInvites[action.payload.group_id] ?? [];
            state.groupInvites[action.payload.group_id] = [action.payload, ...list];
        },
        removeGroupInvite: (state, action: PayloadAction<{ groupId: string; token: string }>) => {
            const list = state.groupInvites[action.payload.groupId];
            if (!list) return;
            state.groupInvites[action.payload.groupId] = list.filter(
                i => i.token !== action.payload.token
            );
        },
        setGroupSharedRankings: (state, action: PayloadAction<{ groupId: string; rankings: SharedRanking[] }>) => {
            state.groupSharedRankings[action.payload.groupId] = action.payload.rankings;
        },
        addGroupIdToRanking: (state, action: PayloadAction<{ rankingId: string; groupId: string }>) => {
            if (!state.savedRankings) return;
            const r = state.savedRankings.find(x => x.ranking_id === action.payload.rankingId);
            if (!r) return;
            const next = new Set(r.group_ids ?? []);
            next.add(action.payload.groupId);
            r.group_ids = Array.from(next);
        },
        removeGroupIdFromRanking: (state, action: PayloadAction<{ rankingId: string; groupId: string }>) => {
            if (!state.savedRankings) return;
            const r = state.savedRankings.find(x => x.ranking_id === action.payload.rankingId);
            if (!r || !r.group_ids) return;
            r.group_ids = r.group_ids.filter(id => id !== action.payload.groupId);
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
    setTableCurrentPage,
    setEntries,
    toggleSelectedContestant,
    setSelectedContestants,
    setPaginatedContestants,
    addAllPaginatedContestants,
    setGlobalSearch,
    setWelcomeOverlayIsOpen,
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
    setGroups,
    upsertGroup,
    setGroupDetail,
    removeGroup,
    setGroupInvites,
    addGroupInvite,
    removeGroupInvite,
    setGroupSharedRankings,
    addGroupIdToRanking,
    removeGroupIdFromRanking,
} = rootSlice.actions;

export default rootSlice.reducer;