import { request } from './client';

export interface HealthResponse {
    status: string;
}

export function ping(): Promise<HealthResponse> {
    return request<HealthResponse>({
        method: 'GET',
        path: '/healthz',
        auth: false,
    });
}
