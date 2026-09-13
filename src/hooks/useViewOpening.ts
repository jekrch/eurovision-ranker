import { useRef } from 'react';

/**
 * How long a view counts as "opening". The last item of the staggered entrance
 * lands around 600ms in (see the duration and stagger tokens in
 * transitions.css); the slack past that absorbs a slow first paint without
 * being long enough for a later interaction to fall inside the window.
 */
const VIEW_OPENING_WINDOW_MS = 900;

/**
 * True while a freshly mounted view is still opening, which is the only time
 * its items should play the staggered entrance.
 *
 * The window is what keeps the cascade from turning into lag. Both country
 * lists remount their rows as the ranking changes - the select view's unranked
 * column rebuilds on every add or remove - so an ungated entrance would replay
 * the whole cascade each time a user picks a country, holding rows back by
 * their position in a list they're actively editing. Inside the window the
 * animation is the view arriving; outside it, rows appear at once.
 *
 * @param hasContent whether the view has rows to show yet. The window opens on
 *   the first render that does rather than on mount: a cold load renders these
 *   lists empty while the contest CSVs are still in flight, and the entrance
 *   belongs to the first paint that actually has something to stage.
 */
export function useViewOpening(hasContent: boolean): boolean {
  const openedAt = useRef<number | null>(null);

  if (hasContent && openedAt.current === null) {
    openedAt.current = Date.now();
  }

  // Read during render, not from an effect: the entrance classes have to be on
  // the element in the same paint it first appears, or it flashes in at full
  // opacity and then animates from transparent.
  return openedAt.current !== null && Date.now() - openedAt.current < VIEW_OPENING_WINDOW_MS;
}
