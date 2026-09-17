// Shared surfaces for the quiz screens, built on the modal vocabulary in
// modalStyles so setup, play and results read as one family with the rest of
// the app's modals.
//
// Accent tints go through color-mix rather than Tailwind's `/15` opacity
// modifier: the modifier emits nothing for colors given as var() references.

import classNames from 'classnames';

/** Selected state for toggles: a wash of the accent with a stronger accent ring. */
export const quizSelected =
  'bg-[color-mix(in_srgb,var(--er-interactive-primary)_16%,transparent)] ring-[color-mix(in_srgb,var(--er-interactive-primary)_70%,transparent)]';

/** Answer feedback washes, drawn from the theme's success and error accents. */
export const quizCorrect =
  'bg-[color-mix(in_srgb,var(--er-accent-success)_14%,transparent)] ring-[color-mix(in_srgb,var(--er-accent-success)_60%,transparent)]';
export const quizIncorrect =
  'bg-[color-mix(in_srgb,var(--er-accent-error)_14%,transparent)] ring-[color-mix(in_srgb,var(--er-accent-error)_60%,transparent)]';

/** Small tracked label heading a section or stat. */
export const quizLabel =
  'text-[0.62rem] font-semibold uppercase tracking-[0.16em] text-[var(--er-text-subtle)]';

/** Recessed well that groups a list or panel of controls. */
export const quizWell = 'rounded-xl bg-black/20 ring-1 ring-inset ring-white/[0.06]';

/** Raised glass tile for a single stat, option or row. */
export const quizTile =
  'rounded-xl bg-white/[0.04] ring-1 ring-inset ring-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]';

/** The screen's main call to action. */
export const quizPrimaryBtn = classNames(
  'w-full py-3 rounded-xl font-semibold text-white flex items-center justify-center gap-2',
  'bg-[var(--er-interactive-primary)] bg-gradient-to-b from-white/[0.12] to-black/[0.06]',
  'ring-1 ring-inset ring-white/15 shadow-lg shadow-black/30',
  'hover:brightness-110 active:scale-[0.99] transition-[filter,transform] duration-150 motion-reduce:transform-none',
);

/** Secondary action that sits beside or under the primary one. */
export const quizSecondaryBtn = classNames(
  'py-2.5 rounded-xl font-medium flex items-center justify-center gap-2',
  'bg-white/[0.05] ring-1 ring-inset ring-white/10 text-[var(--er-text-secondary)]',
  'hover:bg-white/[0.1] hover:text-[var(--er-text-primary)] transition-colors duration-150',
);

/** Small rounded chip for presets and tags. */
export const quizChip =
  'rounded-full bg-white/[0.05] ring-1 ring-inset ring-white/10 text-[var(--er-text-subtle)]';

/** Compact screen title shared by setup and preview. */
export const quizTitle = 'text-base font-semibold leading-tight text-[var(--er-text-primary)]';
