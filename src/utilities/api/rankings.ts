import { request } from './client';
import { CreateRankingPayload, UpdateRankingPayload, UserRanking } from './types';

export function listRankings(): Promise<UserRanking[]> {
    return request<UserRanking[]>({ method: 'GET', path: '/api/rankings' });
}

export function getRanking(id: string): Promise<UserRanking> {
    return request<UserRanking>({ method: 'GET', path: `/api/rankings/${encodeURIComponent(id)}` });
}

export function createRanking(payload: CreateRankingPayload): Promise<UserRanking> {
    return request<UserRanking>({
        method: 'POST',
        path: '/api/rankings',
        body: payload,
    });
}

// id is in the body as ranking_id, not in the path
export function updateRanking(payload: UpdateRankingPayload): Promise<UserRanking> {
    return request<UserRanking>({
        method: 'PATCH',
        path: '/api/rankings',
        body: payload,
    });
}

export function deleteRanking(id: string): Promise<void> {
    return request<void>({
        method: 'DELETE',
        path: `/api/rankings/${encodeURIComponent(id)}`,
    });
}
