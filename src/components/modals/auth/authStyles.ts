export const inputBase =
  'w-full rounded-lg border bg-(--er-surface-primary) border-white/5 text-sm text-(--er-text-primary) placeholder-(--er-text-subtle) focus:outline-hidden focus:ring-2 focus:ring-(--er-button-primary)/40 focus:border-(--er-button-primary)/40 transition-colors';

export const inputWithIcon = `${inputBase} pl-10 pr-3 py-2.5`;

export const primaryBtn =
  'relative overflow-hidden w-full text-white font-medium py-2.5 px-4 rounded-lg text-sm bg-(--er-button-primary) hover:bg-(--er-button-primary-hover) shadow-xs shadow-black/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors';

export const tabBtn = (active: boolean) =>
  `flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2 text-xs font-medium rounded-md transition-colors ${
    active
      ? 'bg-(--er-button-primary)/20 text-(--er-text-primary) ring-1 ring-inset ring-(--er-button-primary)/30 shadow-xs shadow-black/20'
      : 'text-(--er-text-subtle) hover:text-(--er-text-primary) hover:bg-white/3'
  }`;
