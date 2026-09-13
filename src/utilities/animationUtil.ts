import type { CSSProperties } from 'react';

/**
 * The point at which the staggered view entrance stops adding delay. A ranking
 * can run to forty plus countries; past the first dozen the offset only delays
 * the list settling, and the tail is usually below the fold anyway.
 */
const MAX_STAGGER_INDEX = 12;

/**
 * Inline style that positions an item in the staggered view entrance (see
 * `.view-item-enter-animation` in transitions.css). Pass the item's index in
 * its list.
 */
export function staggerStyle(index: number): CSSProperties {
  return { '--er-stagger-index': Math.min(index, MAX_STAGGER_INDEX) } as CSSProperties;
}
