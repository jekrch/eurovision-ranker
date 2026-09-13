import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

type TabBarProps = {
  /** The selected tab's key. A change here slides the underline to the new tab. */
  activeKey: string;
  /** Additional classes for the tab list. */
  className?: string;
  /** TabButton elements (optionally wrapped in conditionals). */
  children: React.ReactNode;
};

type Indicator = {
  left: number;
  top: number;
  width: number;
  /** Slide to this position, rather than appearing at it. */
  animate: boolean;
};

const INDICATOR_THICKNESS = 2;
/** How far the underline reaches past the icon on each side. */
const INDICATOR_OVERHANG = 8;

/**
 * The tab strip shared by the modals: a list of TabButtons with a single
 * underline that slides from the outgoing tab to the incoming one.
 *
 * The underline is one absolutely positioned element rather than a border on
 * each button, since only a single shared element can travel between them. Both
 * its ends are measured from the active tab's content - its icon, and label
 * where there is one - so it stays centred on what it points at rather than on
 * the tab's padded click target, which is the part of a tab a reader can't see.
 * It's given its width outright and only translated into place, so the width
 * can't drift away from the measurement the way a scaled bar's does.
 *
 * Measurements come from offsetLeft/offsetTop/offsetWidth rather than
 * getBoundingClientRect because those are layout values — the modal scales
 * itself up as it opens, which would skew a measurement taken from rects.
 *
 * Only a change of selection is worth animating: when the strip itself moves
 * under the underline (the modal resizing, an icon sizing late) the line goes
 * straight to its new place instead of chasing it.
 */
const TabBar: React.FC<TabBarProps> = ({ activeKey, className, children }) => {
  const listRef = useRef<HTMLUListElement>(null);
  const [indicator, setIndicator] = useState<Indicator | null>(null);

  const tabCount = React.Children.count(children);

  const measure = useCallback((animate: boolean) => {
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[data-tab-active="true"]');
    const target = active?.querySelector<HTMLElement>('[data-tab-indicator-target]') ?? active;

    // no active tab, or nothing laid out to measure yet - drop the underline
    // rather than leave it somewhere stale. A later measurement puts it back.
    if (!active || !target || !target.offsetWidth) {
      setIndicator(null);
      return;
    }

    setIndicator((prev) => {
      // a little past the icon on both sides, but never past the tab itself
      const width = Math.min(target.offsetWidth + INDICATOR_OVERHANG * 2, active.offsetWidth);
      const contentCentre = target.offsetLeft + target.offsetWidth / 2;

      const next = {
        // hung off the content's centre rather than the tab's left edge, so the
        // line stays centred under the icon even if the icon isn't centred in
        // the tab. Rounded to keep both of its edges on a whole pixel.
        left: Math.round(contentCentre - width / 2),
        // sits in the bottom edge of the button, so it stays put when tabs wrap
        top: active.offsetTop + active.offsetHeight - INDICATOR_THICKNESS,
        width,
        animate,
      };

      if (prev && prev.left === next.left && prev.top === next.top && prev.width === next.width) {
        return prev;
      }
      return next;
    });
  }, []);

  // measure before paint so the underline never shows at a stale position. The
  // child count is a dependency because tabs can come and go (a song with no
  // video, say), which shifts the ones after them.
  const lastKeyRef = useRef<string | null>(null);
  useLayoutEffect(() => {
    const isNewSelection = lastKeyRef.current !== null && lastKeyRef.current !== activeKey;
    lastKeyRef.current = activeKey;
    measure(isNewSelection);
  }, [measure, activeKey, tabCount]);

  useEffect(() => {
    const list = listRef.current;
    if (!list || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => measure(false));
    // the strip reflows with the modal, and the tabs settle separately from it:
    // the strip is full width whatever its tabs are doing, so an icon or web
    // font arriving late changes the tabs' boxes without touching the strip's.
    observer.observe(list);
    list.querySelectorAll('button').forEach((tab) => observer.observe(tab));

    return () => observer.disconnect();
  }, [measure, activeKey, tabCount]);

  return (
    <ul
      ref={listRef}
      className={`relative flex flex-wrap -mb-px text-sm font-medium text-center text-[var(--er-text-muted)] dark:text-[var(--er-text-subtle)] ${className ?? ''}`}
    >
      {children}

      {indicator && (
        <li
          aria-hidden="true"
          data-tab-indicator
          className={`absolute left-0 top-0 bg-[var(--er-interactive-primary)] ${indicator.animate ? 'tab-indicator-animation' : ''}`}
          style={{
            width: `${indicator.width}px`,
            height: `${INDICATOR_THICKNESS}px`,
            transform: `translate(${indicator.left}px, ${indicator.top}px)`,
          }}
        />
      )}
    </ul>
  );
};

export default TabBar;
