/**
 * Dev-only guard against history.pushState / replaceState storms.
 *
 * A runaway store/effect loop projects to the URL over and over; Chrome then
 * throttles navigation ("Throttling navigation to …", crbug.com/1038223) and the
 * tab hangs. This wrapper does three things in development:
 *
 *  1. Diagnoses: when calls exceed a burst threshold it logs a stack trace and
 *     the recent URL values so the offending writer (and what is flip-flopping)
 *     is identifiable.
 *  2. Mitigates: it drops the excess calls within the window so the browser
 *     never reaches the hang/throttle state.
 *  3. Records: every write is kept in a ring buffer; call `__dumpHistory()` in
 *     the console after any suspicious behaviour to see the recent writes (URL +
 *     who called) even when the burst was too small to auto-trip.
 *
 * It is a no-op in production builds.
 */

const WINDOW_MS = 1000;
// Legitimate switching writes the URL a handful of times; anything past this in
// a one-second window is a loop, not user activity. Kept low so near-misses that
// self-resolve before a full freeze are still surfaced.
const BURST_LIMIT = 12;
const RING_SIZE = 80;

type HistoryMethod = 'pushState' | 'replaceState';
type Write = { t: number; method: HistoryMethod; url: string; caller: string };

export function installHistoryLoopGuard(): void {
  if (!import.meta.env?.DEV) return;
  const w = window as { __historyLoopGuard?: boolean; __dumpHistory?: () => Write[] };
  if (w.__historyLoopGuard) return;
  w.__historyLoopGuard = true;

  const window_ = new Array<{ t: number }>();
  const ring: Write[] = [];
  let reported = false;

  // pull the first app frame out of the stack so each write is attributed to a
  // recognisable caller (useUrlWriter, updateQueryParams, categoryUrl, …)
  const callerFrom = (stack: string | undefined): string => {
    if (!stack) return '(no stack)';
    const line = stack
      .split('\n')
      .find((l) => /\/src\//.test(l) && !/historyLoopGuard/.test(l));
    return line?.trim() ?? '(unknown caller)';
  };

  const wrap = (method: HistoryMethod) => {
    const original = window.history[method].bind(window.history);

    window.history[method] = ((data: unknown, unused: string, url?: string | URL | null) => {
      const now = performance.now();
      const target = url == null ? window.location.href : String(url);
      const caller = callerFrom(new Error().stack);

      ring.push({ t: now, method, url: target, caller });
      if (ring.length > RING_SIZE) ring.shift();

      while (window_.length && now - window_[0].t > WINDOW_MS) window_.shift();
      window_.push({ t: now });

      if (window_.length > BURST_LIMIT) {
        if (!reported) {
          reported = true;
          const burst = ring.filter((r) => now - r.t <= WINDOW_MS);
          const distinct = Array.from(new Set(burst.map((r) => r.url)));
          const callers = Array.from(new Set(burst.map((r) => r.caller)));
          console.error(
            `[historyLoopGuard] ${window_.length} history writes in ${WINDOW_MS}ms — ` +
              `URL-write loop detected and suppressed.\n` +
              `Callers (${callers.length}):\n${callers.join('\n')}\n` +
              `Distinct URLs (${distinct.length}):\n${distinct.slice(0, 8).join('\n')}\n` +
              `Run __dumpHistory() for the full recent timeline.`,
          );
          setTimeout(() => {
            reported = false;
            window_.length = 0;
          }, WINDOW_MS * 2);
        }
        // circuit-break: skip this navigation so the tab stays responsive
        return;
      }

      return original(data as never, unused, url as never);
    }) as typeof window.history.pushState;
  };

  wrap('pushState');
  wrap('replaceState');

  // on-demand timeline; returns the last RING_SIZE writes with caller + url
  w.__dumpHistory = () => {
    // eslint-disable-next-line no-console
    console.table(
      ring.map((r) => ({ t: Math.round(r.t), method: r.method, caller: r.caller, url: r.url })),
    );
    return ring;
  };
}
