import { request } from './client';
import { AuthResponse } from './types';

export interface InitiateRegisterPayload {
    email: string;
}

export interface CompleteRegisterPayload {
    token: string;
    password: string;
}

export interface LoginPayload {
    email: string;
    password: string;
}

export interface InitiatePasswordResetPayload {
    email: string;
}

export interface CompletePasswordResetPayload {
    token: string;
    password: string;
}

export function registerInitiate(payload: InitiateRegisterPayload): Promise<void> {
    return request<void>({
        method: 'POST',
        path: '/auth/register/initiate',
        body: payload,
        auth: false,
        isAuthEndpoint: true,
    });
}

export function registerComplete(payload: CompleteRegisterPayload): Promise<AuthResponse> {
    return request<AuthResponse>({
        method: 'POST',
        path: '/auth/register/complete',
        body: payload,
        auth: false,
        isAuthEndpoint: true,
    });
}

export function login(payload: LoginPayload): Promise<AuthResponse> {
    return request<AuthResponse>({
        method: 'POST',
        path: '/auth/login',
        body: payload,
        auth: false,
        isAuthEndpoint: true,
    });
}

export function passwordResetInitiate(payload: InitiatePasswordResetPayload): Promise<void> {
    return request<void>({
        method: 'POST',
        path: '/auth/password/reset',
        body: payload,
        auth: false,
        isAuthEndpoint: true,
    });
}

export function passwordResetComplete(payload: CompletePasswordResetPayload): Promise<AuthResponse> {
    return request<AuthResponse>({
        method: 'POST',
        path: '/auth/password/complete',
        body: payload,
        auth: false,
        isAuthEndpoint: true,
    });
}
