import toast from 'react-hot-toast';

import { ApiError } from '../../../../utilities/api/types';

// Surface an API error as a toast, preferring the server's plain-text body and
// falling back to a caller-supplied message. Shared across the cloud tabs.
export function apiErrToast(e: unknown, fallback: string) {
  if (e instanceof ApiError) toast.error(e.body?.trim() || fallback);
  else toast.error(fallback);
}

export function shortDate(s?: string): string {
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString();
}

export function timeUntil(s?: string): string {
  if (!s) return '';
  const ms = new Date(s).getTime() - Date.now();
  if (ms <= 0) return 'expired';
  const days = Math.floor(ms / 86400_000);
  if (days >= 1) return `${days}d`;
  const hours = Math.floor(ms / 3600_000);
  if (hours >= 1) return `${hours}h`;
  const mins = Math.floor(ms / 60_000);
  return `${mins}m`;
}

export function yearToNumber(year: string | undefined): number | undefined {
  if (!year) return undefined;
  return /^\d+$/.test(year) ? Number(year) : undefined;
}
