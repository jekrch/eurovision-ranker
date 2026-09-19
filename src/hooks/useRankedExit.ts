import { useCallback, useEffect, useRef, useState } from 'react';

import { CountryContestant } from '../data/CountryContestant';

/**
 * How long a removed row takes to leave. This mirrors
 * `--er-item-removed-duration` in transitions.css; the store isn't updated
 * until it has run, so the row is still there to animate.
 */
const REMOVED_MS = 200;

/** Mirrors `--er-stagger-step` and the clamp in staggerStyle. */
const STAGGER_STEP_MS = 24;
const MAX_STAGGER_INDEX = 12;

/**
 * How far into a whole column's exit the other column starts taking the rows
 * in, for Add All and Clear. Far enough that the leaving rows are visibly on
 * their way, well short of waiting for the last of them.
 */
export const OVERLAP_LEAD_MS = 100;

/** The key the ranked list uses for a row. */
export const rankedItemKey = (item: CountryContestant) => item.uid ?? item.id;

export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export interface RankedExit {
  /** rows playing their exit, by `rankedItemKey` */
  exitingIds: ReadonlySet<string>;
  /** true while the whole ranking is leaving after a clear */
  isClearing: boolean;
  /** animates one row out, then runs `commit` to remove it from the store */
  removeRanked: (item: CountryContestant, commit: () => unknown) => void;
  /**
   * Animates every row out, top to bottom, then runs `commit`. `overlap`, if
   * given, runs shortly after the rows start leaving, so the selection column
   * can start taking them back while they go; `commit` has to finish the job
   * on its own, since without motion it's all that runs.
   */
  clearRanked: (
    items: CountryContestant[],
    commit: () => unknown,
    overlap?: () => unknown,
  ) => void;
}

/**
 * Holds removals from the ranked list back until their exit has played.
 *
 * The rows are removed by the store, so an exit can't be a mount animation the
 * way the entrances are: the row has to stay rendered, marked as leaving, until
 * its animation is done, and only then is the removal dispatched.
 */
export function useRankedExit(): RankedExit {
  const [exitingIds, setExitingIds] = useState<ReadonlySet<string>>(() => new Set());
  const [isClearing, setIsClearing] = useState(false);
  const isClearingRef = useRef(false);
  const leaving = useRef(new Set<string>());
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

  const removeRanked = useCallback(
    (item: CountryContestant, commit: () => unknown) => {
      const key = rankedItemKey(item);
      if (isClearingRef.current || leaving.current.has(key)) return;
      if (prefersReducedMotion()) {
        commit();
        return;
      }

      leaving.current.add(key);
      setExitingIds((prev) => new Set(prev).add(key));

      after(REMOVED_MS, () => {
        leaving.current.delete(key);
        commit();
        setExitingIds((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      });
    },
    [after],
  );

  const clearRanked = useCallback(
    (items: CountryContestant[], commit: () => unknown, overlap?: () => unknown) => {
      if (isClearingRef.current) return;
      if (!items.length || prefersReducedMotion()) {
        commit();
        return;
      }

      isClearingRef.current = true;
      setIsClearing(true);
      setExitingIds(new Set(items.map(rankedItemKey)));

      if (overlap) after(OVERLAP_LEAD_MS, overlap);

      const lastDelay = Math.min(items.length - 1, MAX_STAGGER_INDEX) * STAGGER_STEP_MS;
      after(lastDelay + REMOVED_MS, async () => {
        // the reset fetches the year's contestants before it empties the
        // ranking, so the rows stay faded out until it has landed
        try {
          await commit();
        } finally {
          isClearingRef.current = false;
          setIsClearing(false);
          setExitingIds(new Set());
        }
      });
    },
    [after],
  );

  return { exitingIds, isClearing, removeRanked, clearRanked };
}
