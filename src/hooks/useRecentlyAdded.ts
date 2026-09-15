import { useRef } from 'react';

/**
 * A country the user just added to the ranking, and when they added it.
 */
export interface RankingAddition {
  id: string;
  at: number;
}

/**
 * How long an addition counts as recent. The entrance itself runs for 360ms
 * (see `--er-item-added-duration` in transitions.css); the slack covers a slow
 * paint while staying short enough that a remount of the list later on doesn't
 * replay it.
 */
const RECENTLY_ADDED_WINDOW_MS = 600;

/**
 * Tracks which ranked rows were just added with a country's "+" button, so
 * those rows, and no others, can play an entrance.
 *
 * Every addition inside the window is remembered, not only the latest one.
 * Someone clicking down the selection column adds faster than the entrance
 * runs, and dropping an earlier row's class partway through would snap that
 * card to its end state.
 *
 * @param latest the most recent addition, or null before the first
 * @returns whether the row with the given id was added within the window
 */
export function useRecentlyAdded(latest: RankingAddition | null): (id: string) => boolean {
  const additions = useRef(new Map<string, number>());
  const now = Date.now();

  // Recorded during render, not from an effect: the entrance class has to be
  // on the row in the same paint it first appears (see useViewOpening).
  if (latest && additions.current.get(latest.id) !== latest.at) {
    additions.current.set(latest.id, latest.at);
  }

  for (const [id, at] of additions.current) {
    if (now - at >= RECENTLY_ADDED_WINDOW_MS) {
      additions.current.delete(id);
    }
  }

  return (id: string) => additions.current.has(id);
}
