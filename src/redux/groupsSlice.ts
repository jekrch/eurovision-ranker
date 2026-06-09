import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Group, GroupInvite, SharedRanking } from '../utilities/api/types';
import { logout } from './authSlice';

export interface GroupsState {
    groups: Group[] | null;
    // Per-group detail (members) + invites + shared rankings.
    // Stored separately so the list view stays light and the detail view
    // can be hydrated on demand and reused across modal opens.
    groupDetails: Record<string, Group>;
    groupInvites: Record<string, GroupInvite[]>;
    groupSharedRankings: Record<string, SharedRanking[]>;
}

const initialState: GroupsState = {
    groups: null,
    groupDetails: {},
    groupInvites: {},
    groupSharedRankings: {},
};

const groupsSlice = createSlice({
    name: 'groups',
    initialState,
    reducers: {
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
    },
    extraReducers: (builder) => {
        // Group state is per-user; clear it all on logout (lives in authSlice).
        builder.addCase(logout, (state) => {
            state.groups = null;
            state.groupDetails = {};
            state.groupInvites = {};
            state.groupSharedRankings = {};
        });
    },
});

export const {
    setGroups,
    upsertGroup,
    setGroupDetail,
    removeGroup,
    setGroupInvites,
    addGroupInvite,
    removeGroupInvite,
    setGroupSharedRankings,
} = groupsSlice.actions;

export default groupsSlice.reducer;
