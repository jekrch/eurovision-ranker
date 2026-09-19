import { useEffect, useLayoutEffect, useRef } from 'react';

import { prefersReducedMotion } from './useRankedExit';

/**
 * The change of width. It uses `--er-view-ease` from transitions.css and runs a
 * little longer than a row's entrance, so a column is still visibly opening as
 * its cards land.
 */
const MORPH_MS = 380;
const MORPH_EASE = 'cubic-bezier(0.16, 1, 0.3, 1)';

/**
 * Lets a column's width travel to its new size rather than snap to it when its
 * content changes wholesale: the ranked column trading its intro for cards, or
 * either column taking in or giving up a whole ranking at once.
 *
 * The width is the one thing here that isn't a transform. The select view's
 * columns sit centred side by side, so a column's size is what moves its
 * neighbour, and a scale wouldn't carry the neighbour along; it's one element
 * for a third of a second, not per-row work. While it runs the column clips its
 * content, and its content (the column's first child) is held at the width
 * it's heading to so the cards don't reflow on every frame.
 *
 * The clip is a clip-path rather than `overflow: hidden`. The selection column
 * scrolls, and hiding its overflow would take its scrollbar away for the
 * length of the resize, only for the bar to come back at the end and knock the
 * content sideways by its own width.
 *
 * @param changeKey the content change a resize can follow; the column is
 *   measured again whenever it changes
 * @param animate whether the change this render made should animate. Anything
 *   else snaps, and cancels a resize still in flight.
 * @returns a ref for the column whose width moves
 */
export function useWidthMorph<Column extends HTMLElement>(
  changeKey: string | number,
  animate: boolean,
) {
  const columnRef = useRef<Column>(null);
  const lastWidth = useRef<number | null>(null);
  const morph = useRef<Animation | null>(null);

  // The column's width as last laid out. A resize observer reports after
  // layout, so when the layout effect below runs this still holds the width
  // from before the change, including partway through an earlier resize.
  useEffect(() => {
    const column = columnRef.current;
    if (!column || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      lastWidth.current = entry.borderBoxSize?.[0]?.inlineSize ?? entry.contentRect.width;
    });
    observer.observe(column);
    return () => observer.disconnect();
  }, []);

  // read from the layout effect, which only reruns on a new changeKey
  const shouldAnimate = useRef(animate);
  shouldAnimate.current = animate;

  useLayoutEffect(() => {
    const column = columnRef.current;
    const content = column?.firstElementChild;
    const from = lastWidth.current;
    if (!column || !(content instanceof HTMLElement) || typeof column.animate !== 'function') {
      return;
    }

    const release = () => {
      morph.current = null;
      content.style.minWidth = '';
      column.style.clipPath = '';
    };

    const running = morph.current;
    release();
    running?.cancel();

    if (!shouldAnimate.current || from === null || prefersReducedMotion()) return;

    const to = column.getBoundingClientRect().width;
    if (Math.abs(to - from) < 1) return;

    // the content's own width, not the column's: a scrolling column's includes
    // its scrollbar
    content.style.minWidth = `${content.getBoundingClientRect().width}px`;
    column.style.clipPath = 'inset(0)';
    const animation = column.animate([{ width: `${from}px` }, { width: `${to}px` }], {
      duration: MORPH_MS,
      easing: MORPH_EASE,
    });
    morph.current = animation;
    animation.onfinish = () => {
      if (morph.current === animation) release();
    };
  }, [changeKey]);

  useEffect(() => () => morph.current?.cancel(), []);

  return columnRef;
}
