import { useCallback, useLayoutEffect, useRef } from 'react';

import { prefersReducedMotion } from './useRankedExit';

/**
 * The slide of the rows below a removed one. It's a little longer than the
 * removal itself so the rows can be seen travelling into the gap, and uses
 * `--er-view-ease` from transitions.css so it lands the way the entrances do.
 */
const SHIFT_MS = 260;
const SHIFT_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';
const SHIFT_ID = 'ranked-row-shift';

/**
 * Slides list rows into their new places when a row is removed, rather than
 * letting them jump there.
 *
 * It's a FLIP: `capture` records where each row is just before the removal,
 * then once the shorter list has been laid out each row that moved is
 * transformed back to where it was and animated to its new place. Only
 * `transform` is animated, so the slide stays on the compositor, unlike
 * collapsing the removed row's height, which re-lays out the list every frame.
 *
 * The row elements have to be wrappers rather than the draggable <li>s, whose
 * transforms belong to the drag library (see transitions.css).
 *
 * @param rowKeys the keys of the rows as rendered; a change is what triggers
 *   the slide after a capture
 * @returns a ref callback factory for the rows, and `capture`
 */
export function useRowShift(rowKeys: readonly string[]) {
  const rows = useRef(new Map<string, HTMLElement>());
  const captured = useRef<Map<string, number> | null>(null);

  const rowRef = useCallback(
    (key: string) => (el: HTMLElement | null) => {
      if (el) {
        rows.current.set(key, el);
      } else {
        rows.current.delete(key);
      }
    },
    [],
  );

  const capture = useCallback(() => {
    if (prefersReducedMotion()) return;
    // the rows' current, on-screen positions: if an earlier slide is still
    // running, the next one carries on from wherever it has got to
    const tops = new Map<string, number>();
    for (const [key, el] of rows.current) {
      tops.set(key, el.getBoundingClientRect().top);
    }
    captured.current = tops;
  }, []);

  const keySignature = rowKeys.join('|');

  useLayoutEffect(() => {
    const before = captured.current;
    if (!before) return;
    captured.current = null;

    for (const [key, el] of rows.current) {
      const oldTop = before.get(key);
      if (oldTop === undefined || typeof el.animate !== 'function') continue;

      el.getAnimations()
        .filter((animation) => animation.id === SHIFT_ID)
        .forEach((animation) => animation.cancel());

      const delta = oldTop - el.getBoundingClientRect().top;
      if (Math.abs(delta) < 0.5) continue;

      el.animate([{ transform: `translateY(${delta}px)` }, { transform: 'translateY(0)' }], {
        id: SHIFT_ID,
        duration: SHIFT_MS,
        easing: SHIFT_EASE,
      });
    }
  }, [keySignature]);

  return { rowRef, capture };
}
