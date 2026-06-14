import { describe, it, expect } from 'vitest';

import reducer, {
  upsertGroup,
  setGroupDetail,
  addGroupInvite,
  removeGroupInvite,
  setGroupSharedRankings,
  GroupsState,
} from './groupsSlice';
import { Group, GroupInvite, GroupMember, SharedRanking } from '../utilities/api/types';

const initial: GroupsState = {
  groups: null,
  groupDetails: {},
  groupInvites: {},
  groupSharedRankings: {},
};

const group = (overrides: Partial<Group> = {}): Group => ({
  id: 'g1',
  name: 'Group 1',
  owner_id: 'u1',
  created_at: '2026-01-01',
  role: 'owner',
  member_count: 1,
  ...overrides,
});

const member = (id: string): GroupMember => ({
  user_id: id,
  email: `${id}@x.c`,
  role: 'member',
  joined_at: '2026-01-01',
});

const invite = (overrides: Partial<GroupInvite> = {}): GroupInvite => ({
  token: 'i1',
  group_id: 'g1',
  created_by: 'u1',
  status: 'pending',
  expires_at: '2026-12-31',
  created_at: '2026-01-01',
  ...overrides,
});

describe('groupsSlice — upsertGroup', () => {
  it('seeds the list when no groups are loaded yet', () => {
    const state = reducer(initial, upsertGroup(group()));
    expect(state.groups).toEqual([group()]);
  });

  it('prepends a new group to an existing list', () => {
    const start: GroupsState = { ...initial, groups: [group()] };
    const state = reducer(start, upsertGroup(group({ id: 'g2', name: 'Group 2' })));
    expect(state.groups?.map((g) => g.id)).toEqual(['g2', 'g1']);
  });

  it('merges into the existing entry when the id already exists', () => {
    const start: GroupsState = { ...initial, groups: [group({ member_count: 1 })] };
    const state = reducer(start, upsertGroup(group({ name: 'Renamed', member_count: 5 })));
    expect(state.groups).toHaveLength(1);
    expect(state.groups?.[0]).toMatchObject({ id: 'g1', name: 'Renamed', member_count: 5 });
  });

  it('caches members in groupDetails when the payload carries them', () => {
    const withMembers = group({ members: [member('u1')] });
    const state = reducer(initial, upsertGroup(withMembers));
    expect(state.groupDetails.g1.members).toEqual([member('u1')]);
  });

  it('preserves cached members when a memberless summary arrives', () => {
    const start: GroupsState = {
      ...initial,
      groupDetails: { g1: group({ members: [member('u1')] }) },
    };
    const state = reducer(start, upsertGroup(group({ name: 'Renamed' })));
    expect(state.groupDetails.g1.name).toBe('Renamed');
    expect(state.groupDetails.g1.members).toEqual([member('u1')]);
  });

  it('does not create a detail entry for a memberless summary with no cache', () => {
    const state = reducer(initial, upsertGroup(group()));
    expect(state.groupDetails.g1).toBeUndefined();
  });
});

describe('groupsSlice — setGroupDetail', () => {
  it('stores the detail and syncs a memberless summary into an existing list entry', () => {
    const start: GroupsState = { ...initial, groups: [group()] };
    const detailed = group({ name: 'Detailed', members: [member('u1')] });
    const state = reducer(start, setGroupDetail(detailed));

    expect(state.groupDetails.g1.members).toEqual([member('u1')]);
    expect(state.groups?.[0].name).toBe('Detailed');
    // The list-level summary intentionally drops the heavy members array.
    expect(state.groups?.[0].members).toBeUndefined();
  });

  it('prepends a summary when the detailed group is not yet in a loaded list', () => {
    const start: GroupsState = { ...initial, groups: [group({ id: 'g2', name: 'Other' })] };
    const state = reducer(start, setGroupDetail(group({ members: [member('u1')] })));
    expect(state.groups?.map((g) => g.id)).toEqual(['g1', 'g2']);
    expect(state.groups?.[0].members).toBeUndefined();
  });

  it('records the detail but does not seed the list when no list has been loaded', () => {
    const state = reducer(initial, setGroupDetail(group({ members: [member('u1')] })));
    expect(state.groupDetails.g1).toBeDefined();
    expect(state.groups).toBeNull();
  });
});

describe('groupsSlice — invites', () => {
  it('prepends an invite, starting a new list when the group has none', () => {
    const state = reducer(initial, addGroupInvite(invite()));
    expect(state.groupInvites.g1).toHaveLength(1);

    const next = reducer(state, addGroupInvite(invite({ token: 'i2' })));
    expect(next.groupInvites.g1.map((i) => i.token)).toEqual(['i2', 'i1']);
  });

  it('removes an invite by token', () => {
    const start: GroupsState = {
      ...initial,
      groupInvites: { g1: [invite(), invite({ token: 'i2' })] },
    };
    const state = reducer(start, removeGroupInvite({ groupId: 'g1', token: 'i1' }));
    expect(state.groupInvites.g1.map((i) => i.token)).toEqual(['i2']);
  });

  it('is a no-op when removing from a group with no invite list', () => {
    const state = reducer(initial, removeGroupInvite({ groupId: 'g1', token: 'i1' }));
    expect(state.groupInvites.g1).toBeUndefined();
  });
});

describe('groupsSlice — setGroupSharedRankings', () => {
  it('stores shared rankings under their group id', () => {
    const rankings = [{ ranking_id: 'r1' } as SharedRanking];
    const state = reducer(initial, setGroupSharedRankings({ groupId: 'g1', rankings }));
    expect(state.groupSharedRankings.g1).toBe(rankings);
  });
});
