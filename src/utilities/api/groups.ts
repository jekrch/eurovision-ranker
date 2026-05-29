import { request } from './client';
import {
    CreateGroupPayload,
    Group,
    GroupInvite,
    GroupInvitePreview,
    SharedRanking,
    UpdateGroupPayload,
} from './types';

export function listGroups(): Promise<Group[]> {
    return request<Group[]>({ method: 'GET', path: '/api/groups' });
}

export function getGroup(id: string): Promise<Group> {
    return request<Group>({
        method: 'GET',
        path: `/api/groups/${encodeURIComponent(id)}`,
    });
}

export function createGroup(payload: CreateGroupPayload): Promise<Group> {
    return request<Group>({
        method: 'POST',
        path: '/api/groups',
        body: payload,
    });
}

export function updateGroup(id: string, payload: UpdateGroupPayload): Promise<Group> {
    return request<Group>({
        method: 'PATCH',
        path: `/api/groups/${encodeURIComponent(id)}`,
        body: payload,
    });
}

export function deleteGroup(id: string): Promise<{ message: string }> {
    return request<{ message: string }>({
        method: 'DELETE',
        path: `/api/groups/${encodeURIComponent(id)}`,
    });
}

export function leaveGroup(id: string): Promise<{ message: string }> {
    return request<{ message: string }>({
        method: 'POST',
        path: `/api/groups/${encodeURIComponent(id)}/leave`,
    });
}

// Invites

export function createInvite(groupId: string): Promise<GroupInvite> {
    return request<GroupInvite>({
        method: 'POST',
        path: `/api/groups/${encodeURIComponent(groupId)}/invites`,
    });
}

export function listInvites(groupId: string): Promise<GroupInvite[]> {
    return request<GroupInvite[]>({
        method: 'GET',
        path: `/api/groups/${encodeURIComponent(groupId)}/invites`,
    });
}

export function revokeInvite(groupId: string, token: string): Promise<{ message: string }> {
    return request<{ message: string }>({
        method: 'DELETE',
        path: `/api/groups/${encodeURIComponent(groupId)}/invites/${encodeURIComponent(token)}`,
    });
}

export function previewInvite(token: string): Promise<GroupInvitePreview> {
    return request<GroupInvitePreview>({
        method: 'GET',
        path: `/api/invites/${encodeURIComponent(token)}`,
    });
}

export interface AcceptInviteResponse {
    message: string;
    group_id?: string;
    group_name?: string;
}

export function acceptInvite(token: string): Promise<AcceptInviteResponse> {
    return request<AcceptInviteResponse>({
        method: 'POST',
        path: `/api/invites/${encodeURIComponent(token)}/accept`,
    });
}

// Shared rankings

export function listGroupRankings(groupId: string): Promise<SharedRanking[]> {
    return request<SharedRanking[]>({
        method: 'GET',
        path: `/api/groups/${encodeURIComponent(groupId)}/rankings`,
    });
}

export function shareRankingWithGroup(
    groupId: string,
    rankingId: string
): Promise<{ message: string }> {
    return request<{ message: string }>({
        method: 'POST',
        path: `/api/groups/${encodeURIComponent(groupId)}/rankings`,
        body: { ranking_id: rankingId },
    });
}

export function unshareRankingFromGroup(
    groupId: string,
    rankingId: string
): Promise<{ message: string }> {
    return request<{ message: string }>({
        method: 'DELETE',
        path: `/api/groups/${encodeURIComponent(groupId)}/rankings/${encodeURIComponent(rankingId)}`,
    });
}
