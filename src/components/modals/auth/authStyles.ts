export const inputBase =
    'w-full rounded-lg border bg-[color:var(--er-surface-primary)] border-white/5 text-sm text-[var(--er-text-primary)] placeholder-[var(--er-text-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/40 focus:border-[var(--er-button-primary)]/40 transition-colors';

export const inputWithIcon = `${inputBase} pl-10 pr-3 py-2.5`;

export const primaryBtn =
    'relative overflow-hidden w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] shadow-sm shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const tabBtn = (active: boolean) =>
    `flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-colors ${
        active
            ? 'bg-[var(--er-button-primary)]/20 text-[var(--er-text-primary)] ring-1 ring-inset ring-[var(--er-button-primary)]/30 shadow-sm shadow-black/20'
            : 'text-[var(--er-text-subtle)] hover:text-[var(--er-text-primary)] hover:bg-white/[0.03]'
    }`;
