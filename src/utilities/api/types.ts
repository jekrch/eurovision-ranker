export interface AuthUser {
    id: string;
    email: string;
    created_at?: string;
}

export interface AuthResponse {
    token: string;
    user: AuthUser;
}

export interface UserRanking {
    ranking_id: string;
    user_id?: string;
    name: string;
    description?: string;
    year?: number;
    ranking: string;
    public?: boolean;
    group_ids?: string[];
    created_at?: string;
    updated_at?: string;
}

export interface CreateRankingPayload {
    name: string;
    description?: string;
    year?: number;
    ranking: string;
    public?: boolean;
    group_ids?: string[];
}

export interface UpdateRankingPayload {
    ranking_id: string;
    name?: string;
    description?: string;
    year?: number;
    ranking?: string;
    public?: boolean;
}

export type ApiErrorKind =
    | 'network'
    | 'unauthorized'
    | 'forbidden'
    | 'rate_limited'
    | 'max_rankings'
    | 'not_found'
    | 'bad_request'
    | 'server'
    | 'unknown';

export class ApiError extends Error {
    status: number;
    kind: ApiErrorKind;
    body: string;

    constructor(message: string, status: number, kind: ApiErrorKind, body: string = '') {
        super(message);
        this.name = 'ApiError';
        this.status = status;
        this.kind = kind;
        this.body = body;
    }
}
