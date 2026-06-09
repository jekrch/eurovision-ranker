import toast from 'react-hot-toast';
import { ApiError, ApiErrorKind } from './types';

const DEFAULT_PROD_URL = 'https://api.eurovision-ranker.com';

export function getApiBaseUrl(): string {
    const envUrl = import.meta.env.VITE_EUROVISION_API_URL;
    if (envUrl && envUrl.length) return envUrl.replace(/\/+$/, '');
    return import.meta.env.DEV ? '/api' : DEFAULT_PROD_URL;
}

export const TOKEN_STORAGE_KEY = 'eurovision_ranker_token';

export function getToken(): string | null {
    try {
        return localStorage.getItem(TOKEN_STORAGE_KEY);
    } catch {
        return null;
    }
}

export function setToken(token: string | null): void {
    try {
        if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
        else localStorage.removeItem(TOKEN_STORAGE_KEY);
    } catch {
        // ignore
    }
}

type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;

export function registerUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
    onUnauthorized = handler;
}

export interface RequestOptions {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    path: string;
    body?: unknown;
    auth?: boolean;
    // Flag this as an auth endpoint so 429 toast copy is auth-specific.
    isAuthEndpoint?: boolean;
}

function classify(status: number, body: string): ApiErrorKind {
    if (status === 401) return 'unauthorized';
    if (status === 403) return 'forbidden';
    if (status === 404) return 'not_found';
    if (status === 410) return 'gone';
    if (status === 429) return 'rate_limited';
    if (status === 400 && body.toLowerCase().startsWith('maximum number of rankings'))
        return 'max_rankings';
    if (status >= 400 && status < 500) return 'bad_request';
    if (status >= 500) return 'server';
    return 'unknown';
}

export async function request<T = unknown>(opts: RequestOptions): Promise<T> {
    const { method = 'GET', path, body, auth = true, isAuthEndpoint = false } = opts;
    const base = getApiBaseUrl();
    const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (auth) {
        const token = getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;
    try {
        response = await fetch(url, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });
    } catch (e) {
        const message = e instanceof Error ? e.message : 'Network error';
        throw new ApiError(message || 'Network error', 0, 'network');
    }

    const rawBody = await response.text();

    if (!response.ok) {
        const kind = classify(response.status, rawBody);

        if (kind === 'unauthorized') {
            setToken(null);
            if (onUnauthorized) onUnauthorized();
        }

        if (kind === 'rate_limited' && isAuthEndpoint) {
            toast.error('Too many login/register attempts — try again in a minute.');
        }

        throw new ApiError(rawBody || response.statusText, response.status, kind, rawBody);
    }

    if (!rawBody) return undefined as T;
    try {
        return JSON.parse(rawBody) as T;
    } catch {
        return rawBody as unknown as T;
    }
}
