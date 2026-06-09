import { AuthUser } from '../utilities/api/types';
import { getToken, setToken, TOKEN_STORAGE_KEY } from '../utilities/api/client';

export type AuthStatus = 'idle' | 'loading' | 'error';

export interface AuthSliceFields {
    user: AuthUser | null;
    token: string | null;
    authStatus: AuthStatus;
    authError: string | null;
    currentRankingId: string | null;
    lastSavedSignature: string | null;
}

interface JwtPayload {
    exp?: number;
    sub?: string;
    user_id?: string;
    email?: string;
    [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return null;
        return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    } catch {
        return null;
    }
}

export function isTokenExpired(token: string): boolean {
    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.exp !== 'number') return false;
    return payload.exp * 1000 <= Date.now();
}

export function userFromToken(token: string): AuthUser | null {
    const payload = decodeJwtPayload(token);
    if (!payload) return null;
    const id = payload.sub ?? payload.user_id;
    const email = payload.email;
    if (!id || !email) return null;
    return { id: String(id), email: String(email) };
}

export function loadInitialAuth(): { token: string | null; user: AuthUser | null } {
    const stored = getToken();
    if (!stored) return { token: null, user: null };
    if (isTokenExpired(stored)) {
        setToken(null);
        return { token: null, user: null };
    }
    return { token: stored, user: userFromToken(stored) };
}

export { TOKEN_STORAGE_KEY };
