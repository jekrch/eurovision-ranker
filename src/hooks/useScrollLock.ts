import { useEffect } from 'react';

/**
 * Prevents the page behind an open modal from scrolling, while still allowing
 * the modal's own content to scroll.
 *
 * The app's scroll happens in an inner container (not the document body), and
 * the modal overlay is rendered as a sibling that covers the whole viewport,
 * so a simple `body { overflow: hidden }` doesn't help. Instead we intercept
 * wheel/touchmove events at the document level and only allow those that
 * originate inside a modal's content (marked with `data-modal-content`).
 *
 * Uses reference counting so that layered modals (e.g. a confirmation modal
 * over another modal) don't release the lock until the last one closes.
 *
 * Dropdown menus are portaled to `document.body` (outside the modal content),
 * so they're matched separately via their `.dropdown-menu` marker to keep them
 * scrollable while the lock is active.
 */

let lockCount = 0;

const isInsideModalContent = (target: EventTarget | null): boolean =>
  target instanceof Element &&
  !!target.closest('[data-modal-content], .dropdown-menu');

const preventBackgroundScroll = (e: Event) => {
  if (e.cancelable && !isInsideModalContent(e.target)) {
    e.preventDefault();
  }
};

const lock = () => {
  if (lockCount === 0) {
    document.addEventListener('wheel', preventBackgroundScroll, { passive: false });
    document.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
  }
  lockCount++;
};

const unlock = () => {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.removeEventListener('wheel', preventBackgroundScroll);
    document.removeEventListener('touchmove', preventBackgroundScroll);
  }
};

export const useScrollLock = (active: boolean): void => {
  useEffect(() => {
    if (!active) return;
    lock();
    return () => unlock();
  }, [active]);
};
