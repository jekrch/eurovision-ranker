import { describe, it, expect, vi } from 'vitest';
import { combineReducers, configureStore } from '@reduxjs/toolkit';

// The api client touches localStorage on import (token persistence). Stub it so
// the slices can be exercised in isolation without a DOM storage backend.
vi.mock('../utilities/api/client', () => ({
    getToken: () => null,
    setToken: vi.fn(),
    TOKEN_STORAGE_KEY: 'er_token',
}));

import authReducer, {
    loginSuccess,
    logout,
    setSavedRankings,
    addGroupIdToRanking,
    removeGroupIdFromRanking,
} from './authSlice';
import tableReducer, { toggleSelectedContestant, setEntries } from './tableSlice';
import groupsReducer, { setGroups, setGroupInvites, removeGroup } from './groupsSlice';
import rootReducer, { setName } from './rootSlice';
import { Group, GroupInvite, UserRanking } from '../utilities/api/types';
import { ContestantRow } from '../components/table/tableTypes';

function makeStore() {
    return configureStore({
        reducer: combineReducers({
            root: rootReducer,
            auth: authReducer,
            table: tableReducer,
            groups: groupsReducer,
        }),
    });
}

const ranking = (overrides: Partial<UserRanking> = {}): UserRanking => ({
    ranking_id: 'r1',
    name: 'My Ranking',
    ranking: 'abc',
    ...overrides,
});

const group = (overrides: Partial<Group> = {}): Group => ({
    id: 'g1',
    name: 'Group 1',
    owner_id: 'u1',
    created_at: '2026-01-01',
    role: 'owner',
    member_count: 1,
    ...overrides,
});

describe('store decomposition', () => {
    it('combines the four domain slices under their own keys', () => {
        const state = makeStore().getState();
        expect(Object.keys(state).sort()).toEqual(['auth', 'groups', 'root', 'table']);
    });

    it('routes each action only to its owning slice', () => {
        const store = makeStore();
        store.dispatch(setName('Eurovision'));
        store.dispatch(loginSuccess({ token: 't', user: { id: 'u1', email: 'a@b.c' } }));
        store.dispatch(setEntries([{ id: 'c1' } as ContestantRow]));
        store.dispatch(setGroups([group()]));

        const state = store.getState();
        expect(state.root.name).toBe('Eurovision');
        expect(state.auth.user?.id).toBe('u1');
        expect(state.table.tableState.entries).toHaveLength(1);
        expect(state.groups.groups).toHaveLength(1);
    });

    it('clears auth and group state on logout (cross-slice extraReducer)', () => {
        const store = makeStore();
        store.dispatch(loginSuccess({ token: 't', user: { id: 'u1', email: 'a@b.c' } }));
        store.dispatch(setSavedRankings([ranking()]));
        store.dispatch(setGroups([group()]));
        store.dispatch(setGroupInvites({ groupId: 'g1', invites: [{ token: 'i1', group_id: 'g1' } as GroupInvite] }));

        store.dispatch(logout());

        const state = store.getState();
        expect(state.auth.user).toBeNull();
        expect(state.auth.token).toBeNull();
        expect(state.auth.savedRankings).toBeNull();
        // groupsSlice listens to logout and wipes its own state
        expect(state.groups.groups).toBeNull();
        expect(state.groups.groupInvites).toEqual({});
    });
});

describe('authSlice — ranking↔group link reducers', () => {
    it('adds and removes a group id on a saved ranking', () => {
        const store = makeStore();
        store.dispatch(setSavedRankings([ranking()]));

        store.dispatch(addGroupIdToRanking({ rankingId: 'r1', groupId: 'g1' }));
        expect(store.getState().auth.savedRankings?.[0].group_ids).toEqual(['g1']);

        // idempotent add
        store.dispatch(addGroupIdToRanking({ rankingId: 'r1', groupId: 'g1' }));
        expect(store.getState().auth.savedRankings?.[0].group_ids).toEqual(['g1']);

        store.dispatch(removeGroupIdFromRanking({ rankingId: 'r1', groupId: 'g1' }));
        expect(store.getState().auth.savedRankings?.[0].group_ids).toEqual([]);
    });
});

describe('tableSlice — toggleSelectedContestant', () => {
    it('toggles a contestant in and out of the selection', () => {
        const store = makeStore();
        store.dispatch(setEntries([{ id: 'c1' } as ContestantRow]));

        store.dispatch(toggleSelectedContestant('c1'));
        expect(store.getState().table.tableState.selectedContestants.map(c => c.id)).toEqual(['c1']);

        store.dispatch(toggleSelectedContestant('c1'));
        expect(store.getState().table.tableState.selectedContestants).toEqual([]);
    });
});

describe('groupsSlice — removeGroup', () => {
    it('removes the group and its associated detail/invite/shared caches', () => {
        const store = makeStore();
        store.dispatch(setGroups([group(), group({ id: 'g2', name: 'Group 2' })]));
        store.dispatch(setGroupInvites({ groupId: 'g1', invites: [{ token: 'i1', group_id: 'g1' } as GroupInvite] }));

        store.dispatch(removeGroup('g1'));

        const state = store.getState();
        expect(state.groups.groups?.map(g => g.id)).toEqual(['g2']);
        expect(state.groups.groupInvites.g1).toBeUndefined();
    });
});
