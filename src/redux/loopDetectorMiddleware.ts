import { Middleware } from '@reduxjs/toolkit';

/**
 * Dev-only middleware that surfaces a runaway dispatch loop. When the same
 * action type is dispatched far more often than any real interaction would in a
 * short window, it logs the offending type and a count breakdown once, so the
 * action driving a freeze (and the URL-write storm behind it) is identifiable.
 *
 * It only observes — it never swallows actions — and is a no-op in production.
 */
const WINDOW_MS = 1000;
// A single switch dispatches a handful of actions; >15 of the *same* type in a
// second is a loop. Kept low so near-misses that self-resolve are still caught.
const TYPE_LIMIT = 15;
const RING_SIZE = 120;

export const loopDetectorMiddleware: Middleware = () => {
  const counts = new Map<string, number>();
  const ring: { t: number; type: string }[] = [];
  let windowStart = 0;
  let reported = false;

  if (import.meta.env?.DEV) {
    (window as { __dumpActions?: () => { t: number; type: string }[] }).__dumpActions = () => {
      // eslint-disable-next-line no-console
      console.table(ring.map((r) => ({ t: Math.round(r.t), type: r.type })));
      return ring;
    };
  }

  return (next) => (action) => {
    if (import.meta.env?.DEV) {
      const now = performance.now();
      if (now - windowStart > WINDOW_MS) {
        windowStart = now;
        counts.clear();
        reported = false;
      }

      const type = (action as { type?: string })?.type ?? 'unknown';
      const count = (counts.get(type) ?? 0) + 1;
      counts.set(type, count);

      ring.push({ t: now, type });
      if (ring.length > RING_SIZE) ring.shift();

      if (count > TYPE_LIMIT && !reported) {
        reported = true;
        const breakdown = Array.from(counts.entries())
          .filter(([, c]) => c > 5)
          .sort((a, b) => b[1] - a[1])
          .map(([t, c]) => `  ${t}: ${c}`)
          .join('\n');
        console.error(
          `[loopDetector] "${type}" dispatched ${count}x within ${WINDOW_MS}ms — ` +
            `likely a render/effect loop.\nActions this window:\n${breakdown}`,
        );
      }
    }

    return next(action);
  };
};
