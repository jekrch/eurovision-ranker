export interface AuthUser {
    id: string;
    email: string;
    username?: string;
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
    // Read-only author attribution, only present on single-ranking reads
    // (load-by-id). Username is preferred; email is the fallback.
    author_username?: string;
    author_email?: string;
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
    | 'gone'
    | 'bad_request'
    | 'server'
    | 'unknown';

export type GroupRole = 'owner' | 'member';

export interface GroupMember {
    user_id: string;
    email: string;
    role: GroupRole;
    joined_at: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
    owner_id: string;
    created_at: string;
    updated_at?: string;
    role: GroupRole;
    member_count: number;
    members?: GroupMember[];
}

export interface GroupInvite {
    token: string;
    group_id: string;
    group_name?: string;
    created_by: string;
    status: 'pending' | 'accepted';
    expires_at: string;
    created_at: string;
    url?: string;
}

export interface GroupInvitePreview {
    group_id: string;
    group_name: string;
    description?: string;
    image_url?: string;
    member_count: number;
    expires_at: string;
    already_member: boolean;
}

export interface SharedRanking extends UserRanking {
    owner_email: string;
    shared_at: string;
}

export interface CreateGroupPayload {
    name: string;
    description?: string;
    image_url?: string;
}

export interface UpdateGroupPayload {
    name: string;
    description?: string;
    image_url?: string;
}

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
