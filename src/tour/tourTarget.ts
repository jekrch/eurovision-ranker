/**
 * Locating the element a tour step points at.
 *
 * Every step targets a CSS selector, and most of those elements only exist once
 * the app has been put into the state the step is describing - the "View List"
 * button is only rendered in the select view with something ranked, the sorter
 * button only in the list view, the sorter modal only once it's open. A step
 * whose target isn't mounted yet is the one thing react-joyride can't recover
 * from on its own, so the tour has to wait for the target itself rather than
 * hand joyride a step it can't render.
 */

/** how long to give a step's target to appear before the tour gives up on it */
export const TARGET_WAIT_MS = 3000;

/** how often to re-check while waiting */
const POLL_INTERVAL_MS = 50;

/**
 * Mirrors the visibility test react-joyride applies before it will show a step,
 * so a target this module reports as present is one joyride will also accept.
 * Size isn't part of it: some targets are deliberately empty containers that
 * only mark a position.
 */
function isVisible(element: HTMLElement): boolean {
  let node: HTMLElement | null = element;

  while (node && node !== document.body) {
    const { display, visibility } = window.getComputedStyle(node);

    if (display === 'none' || visibility === 'hidden') {
      return false;
    }

    node = node.parentElement;
  }

  return true;
}

/** The step target for `selector`, or null if it isn't mounted and visible. */
export function findTourTarget(selector: string): HTMLElement | null {
  const element = document.querySelector<HTMLElement>(selector);

  return element && isVisible(element) ? element : null;
}

/**
 * Resolves true once `selector` is mounted and visible, or false if it hasn't
 * appeared within `timeoutMs`. Resolves synchronously-ish on the first poll when
 * the target is already there, which is the common case.
 */
export function waitForTourTarget(
  selector: string,
  timeoutMs: number = TARGET_WAIT_MS,
): Promise<boolean> {
  if (findTourTarget(selector)) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    const deadline = Date.now() + timeoutMs;

    const intervalId = setInterval(() => {
      if (findTourTarget(selector)) {
        clearInterval(intervalId);
        resolve(true);
      } else if (Date.now() >= deadline) {
        clearInterval(intervalId);
        resolve(false);
      }
    }, POLL_INTERVAL_MS);
  });
}

/** A promise that settles after `ms`, for step actions that need to let the UI land. */
export function tourDelay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
