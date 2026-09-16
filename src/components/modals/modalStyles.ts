// Shared surface vocabulary for the app's modals, so panels, dividers, headings
// and footer buttons read as one family wherever they're used. The welcome
// overlay builds on these too, but deliberately keeps its own festive dressing
// (drifting colour fields, gradient wordmark, heart) layered on top.

/** Panel chrome: radius, hairline ring, and the shadow that lifts it off the backdrop. */
export const modalPanel = 'rounded-2xl ring-1 ring-white/10 shadow-2xl shadow-black/50';

/** The dimmed, blurred ground a modal sits on. */
export const modalBackdrop = 'bg-black/60 backdrop-blur-sm';

/** Divider that fades out at both ends — sits under modal headers and tab strips. */
export const hairline = 'h-px bg-gradient-to-r from-transparent via-white/15 to-transparent';

/** Small tracked label above a title. */
export const eyebrow =
  'text-[0.6rem] font-medium uppercase tracking-[0.2em] text-[var(--er-text-subtle)]';

/** Square tile an icon sits in, so icons of differing widths line up down a list. */
export const iconChip =
  'flex h-6 w-6 flex-none items-center justify-center rounded-md bg-white/[0.07] ring-1 ring-inset ring-white/10';

/**
 * Footer-button sizing for IconButton. Every utility is marked important on
 * purpose: IconButton's own `rounded-md`, `text-xs` and `font-normal` are
 * emitted after these in Tailwind's output, so unflagged they quietly win.
 */
export const modalActionBtn =
  '!rounded-lg !px-4 !py-2.5 !text-[0.8rem] !font-medium transition-colors duration-150';

/**
 * The same button, sized down for prompts whose actions shouldn't outweigh the
 * text above them. Same reason every utility is marked important.
 */
export const modalActionBtnSm =
  '!rounded-lg !px-3 !py-1.5 !text-[0.75rem] !font-medium transition-colors duration-150';

/** Right-aligned footer row. */
export const modalFooter = 'flex justify-end gap-2.5';
