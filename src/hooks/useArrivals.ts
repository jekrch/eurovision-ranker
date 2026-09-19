import { useRef } from 'react';

/**
 * How long a batch of arrivals keeps its entrance class. The last of a
 * staggered batch lands around 650ms in (twelve stagger steps plus the
 * entrance, see transitions.css); the slack covers a slow paint while staying
 * short enough that a remount of the rows later on doesn't replay it.
 */
const ARRIVALS_WINDOW_MS = 900;

/**
 * Picks out the rows that have just appeared in a list, so a batch of them -
 * a whole ranking moved across by Add All or Clear - can play a staggered
 * entrance while the rows that were already there stay put.
 *
 * @param keys the keys of the rows as rendered
 * @param active whether rows new in this render count as arrivals
 * @returns each arrival's place in its batch, for its stagger, or undefined
 *   for a row that was already there
 */
export function useArrivals(
  keys: readonly string[],
  active: boolean,
): (key: string) => number | undefined {
  const known = useRef<Set<string> | null>(null);
  const batch = useRef<{ at: number; order: Map<string, number> } | null>(null);
  const now = Date.now();

  // Worked out during render, not in an effect: the entrance class has to be
  // on the row in the same paint it first appears (see useViewOpening).
  const previous = known.current;
  if (previous && active) {
    const fresh = keys.filter((key) => !previous.has(key));
    if (fresh.length) {
      batch.current = { at: now, order: new Map(fresh.map((key, index) => [key, index])) };
    }
  }
  known.current = new Set(keys);

  if (batch.current && now - batch.current.at >= ARRIVALS_WINDOW_MS) {
    batch.current = null;
  }

  const order = batch.current?.order;
  return (key: string) => order?.get(key);
}
