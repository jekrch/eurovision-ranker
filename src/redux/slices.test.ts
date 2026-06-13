import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi } from 'vitest';

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
import groupsReducer, { setGroups, setGroupInvites, removeGroup } from './groupsSlice';
import rootReducer, {
  setName,
  setCategories,
  setActiveCategory,
  setGlobalSearch,
  setCategoryRankings,
  setActiveRankingAndSyncCategoryMembership,
} from './rootSlice';
import tableReducer, { toggleSelectedContestant, setEntries } from './tableSlice';
import { ContestantRow } from '../components/table/tableTypes';
import { Group, GroupInvite, UserRanking } from '../utilities/api/types';

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
    store.dispatch(
      setGroupInvites({ groupId: 'g1', invites: [{ token: 'i1', group_id: 'g1' } as GroupInvite] }),
    );

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
    expect(store.getState().table.tableState.selectedContestants.map((c) => c.id)).toEqual(['c1']);

    store.dispatch(toggleSelectedContestant('c1'));
    expect(store.getState().table.tableState.selectedContestants).toEqual([]);
  });
});

describe('rootSlice — setActiveRankingAndSyncCategoryMembership', () => {
  // minimal CountryContestant identified by uid (global mode keys by uid)
  const c = (uid: string) => ({ id: uid, uid, country: { id: uid }, contestant: null }) as never;
  const uids = (slot: { uid?: string }[]) => slot.map((i) => i.uid);

  function setup() {
    const store = makeStore();
    store.dispatch(setGlobalSearch(true));
    store.dispatch(
      setCategories([
        { name: 'Original', weight: 5 },
        { name: 'Televote', weight: 0 },
        { name: 'Jury', weight: 0 },
      ]),
    );
    store.dispatch(setActiveCategory(0));
    store.dispatch(
      setCategoryRankings([
        [c('a'), c('b'), c('c')],
        [c('b'), c('a')],
        [c('b'), c('a'), c('c'), c('d')],
      ]),
    );
    return store;
  }

  it('brings every category to the same membership, preserving each order', () => {
    const store = setup();

    // membership drops c and d; each other slot keeps its own order for a/b
    store.dispatch(setActiveRankingAndSyncCategoryMembership([c('a'), c('b')]));

    const slots = store.getState().root.categoryRankings;
    expect(uids(slots[0])).toEqual(['a', 'b']);
    expect(uids(slots[1])).toEqual(['b', 'a']);
    expect(uids(slots[2])).toEqual(['b', 'a']);
  });

  it('appends a newly added contestant to every category once', () => {
    const store = setup();

    store.dispatch(setActiveRankingAndSyncCategoryMembership([c('a'), c('b'), c('c'), c('e')]));

    const slots = store.getState().root.categoryRankings;
    expect(uids(slots[0])).toEqual(['a', 'b', 'c', 'e']);
    // slot 1 kept b,a then gains the missing c,e; slot 2 kept b,a,c then gains e
    expect(uids(slots[1])).toEqual(['b', 'a', 'c', 'e']);
    expect(uids(slots[2])).toEqual(['b', 'a', 'c', 'e']);
  });

  it('is idempotent — re-applying the same membership never duplicates entries', () => {
    const store = setup();
    const membership = [c('a'), c('b'), c('e')];

    store.dispatch(setActiveRankingAndSyncCategoryMembership(membership));
    const once = store.getState().root.categoryRankings.map(uids);

    // a re-running effect can dispatch the same thing again; state must not drift
    store.dispatch(setActiveRankingAndSyncCategoryMembership(membership));
    store.dispatch(setActiveRankingAndSyncCategoryMembership(membership));
    const thrice = store.getState().root.categoryRankings.map(uids);

    expect(thrice).toEqual(once);
    // no slot has a duplicated uid
    thrice.forEach((slot) => expect(slot.length).toBe(new Set(slot).size));
  });
});

describe('groupsSlice — removeGroup', () => {
  it('removes the group and its associated detail/invite/shared caches', () => {
    const store = makeStore();
    store.dispatch(setGroups([group(), group({ id: 'g2', name: 'Group 2' })]));
    store.dispatch(
      setGroupInvites({ groupId: 'g1', invites: [{ token: 'i1', group_id: 'g1' } as GroupInvite] }),
    );

    store.dispatch(removeGroup('g1'));

    const state = store.getState();
    expect(state.groups.groups?.map((g) => g.id)).toEqual(['g2']);
    expect(state.groups.groupInvites.g1).toBeUndefined();
  });
});
