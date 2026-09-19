import { useCallback, useEffect, useRef, useState } from 'react';

import { OVERLAP_LEAD_MS, prefersReducedMotion } from './useRankedExit';

/** Mirrors `--er-item-removed-duration` in transitions.css. */
const LEAVE_MS = 200;

/** Mirrors `--er-stagger-step` and the clamp in staggerStyle. */
const STAGGER_STEP_MS = 24;
const MAX_STAGGER_INDEX = 12;

/**
 * How long after a bulk move its lists treat new rows as its arrivals. Clear
 * fetches the year's contestants before it refills the selection column, so
 * this has to cover that as well as the render.
 */
const MOVE_WINDOW_MS = 1500;

export interface BulkMove {
  /** true while the selection column's rows are leaving for the ranking */
  isAddingAll: boolean;
  /**
   * Animates every row of the selection column out toward the ranking. Shortly
   * after they start leaving `moveAcross` runs, so the ranking takes them in
   * while they go, and once they've gone `finish` takes them out of the
   * selection column. `moveAcross` returns what it moved, for `finish`.
   * `count` is how many rows there are, for the stagger.
   */
  addAll: <Moved>(count: number, moveAcross: () => Moved, finish: (moved: Moved) => void) => void;
  /** marks a whole ranking as about to move between the columns */
  markMoved: () => void;
  /**
   * Whether a bulk move is in progress. Read during render: it's backed by a
   * ref, so a list re-rendered by the store update itself sees it.
   */
  isMoving: () => boolean;
}

/**
 * Coordinates the two select view columns when a whole ranking moves between
 * them at once - Add All sending every country across, Clear sending them all
 * back - so the rows leave one column and arrive in the other rather than
 * blinking from one to the other, and both columns resize smoothly
 * (see useArrivals and useWidthMorph).
 */
export function useBulkMove(): BulkMove {
  const [isAddingAll, setIsAddingAll] = useState(false);
  const addingAll = useRef(false);
  const movedAt = useRef<number | null>(null);
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  const after = useCallback((ms: number, run: () => void) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer);
      run();
    }, ms);
    timers.current.add(timer);
  }, []);

  const markMoved = useCallback(() => {
    movedAt.current = Date.now();
  }, []);

  const isMoving = useCallback(
    () => movedAt.current !== null && Date.now() - movedAt.current < MOVE_WINDOW_MS,
    [],
  );

  const addAll = useCallback(
    <Moved>(count: number, moveAcross: () => Moved, finish: (moved: Moved) => void) => {
      if (addingAll.current) return;
      if (!count || prefersReducedMotion()) {
        finish(moveAcross());
        return;
      }

      addingAll.current = true;
      setIsAddingAll(true);

      // The ranking takes the countries in while the selection column's rows
      // are still leaving; for that moment they're in both lists, the copies
      // on the left already on their way out and not draggable.
      let moved: Moved;
      after(OVERLAP_LEAD_MS, () => {
        markMoved();
        moved = moveAcross();
      });

      const lastDelay = Math.min(count - 1, MAX_STAGGER_INDEX) * STAGGER_STEP_MS;
      after(Math.max(lastDelay + LEAVE_MS, OVERLAP_LEAD_MS), () => {
        finish(moved);
        addingAll.current = false;
        setIsAddingAll(false);
      });
    },
    [after, markMoved],
  );

  return { isAddingAll, addAll, markMoved, isMoving };
}
