// Shared Tailwind class strings for the cloud-backed config tabs (Account /
// Saved rankings and Groups) and their subcomponents. Extracted so both tabs
// stay visually consistent without duplicating these long utility strings.

export const sectionLabel =
  'text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--er-text-subtle)]';

export const inputClass =
  'border text-sm rounded-md block w-full p-2 bg-[color:var(--er-surface-primary)] border-white/5 placeholder-[var(--er-text-subtle)] text-[var(--er-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--er-button-primary)]/40 focus:border-[var(--er-button-primary)]/40';

export const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-white bg-[var(--er-button-primary)] hover:bg-[var(--er-button-primary-hover)] disabled:bg-[var(--er-button-neutral)]/40 disabled:text-[var(--er-text-subtle)] disabled:cursor-not-allowed transition-colors';

export const ghostBtn =
  'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 disabled:opacity-40 disabled:cursor-not-allowed transition-colors';

// Min 36px tap target; mobile-friendly hit zone.
export const iconBtn =
  'min-w-9 h-9 inline-flex items-center justify-center rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 disabled:opacity-40 transition-colors';

// Labeled action chip. Icon + text so the action reads clearly without a
// tooltip (mobile has none). min-h keeps a comfortable tap target.
export const actionBtn =
  'inline-flex items-center gap-1.5 px-2.5 min-h-[34px] text-[11px] font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-[var(--er-text-primary)] hover:bg-[var(--er-button-neutral)]/40 transition-colors';

export const dangerActionBtn =
  'inline-flex items-center gap-1.5 px-2.5 min-h-[34px] text-[11px] font-medium rounded-md text-[var(--er-text-tertiary)] hover:text-red-400 hover:bg-red-500/10 transition-colors';
