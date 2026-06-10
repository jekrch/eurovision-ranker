import { request } from './client';
import { AuthUser } from './types';

export function getMe(): Promise<AuthUser> {
  return request<AuthUser>({ method: 'GET', path: '/api/me' });
}

export function updateUsername(username: string): Promise<AuthUser> {
  return request<AuthUser>({
    method: 'PATCH',
    path: '/api/me',
    body: { username },
  });
}
