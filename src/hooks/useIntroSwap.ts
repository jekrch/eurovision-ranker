import { useEffect, useRef, useState } from 'react';

import { prefersReducedMotion } from './useRankedExit';

/**
 * How long the intro takes to leave. This mirrors `--er-intro-swap-duration`
 * in transitions.css; the intro stays rendered for that long after the first
 * country arrives so it has something to animate.
 */
const INTRO_EXIT_MS = 240;

export type IntroPhase = 'idle' | 'entering' | 'leaving';

/**
 * Animates the select view's ranked column between its intro and its list: the
 * intro slides out to the right as the first country comes in and slides back
 * in when the last one goes. The column's width follows it (see useWidthMorph).
 * The selection column's all-ranked state uses it the same way.
 *
 * @param isEmpty whether the column is showing its intro rather than rows
 * @param isArmed whether a change of `isEmpty` should animate. A cold load
 *   renders the column empty until the ranking lands, and that isn't an
 *   addition anyone made.
 * @param exitMs how long the content takes to leave, mirroring its exit
 *   animation's duration
 */
export function useIntroSwap(isEmpty: boolean, isArmed: boolean, exitMs = INTRO_EXIT_MS) {
  const [, rerender] = useState(0);
  const wasEmpty = useRef(isEmpty);
  const wasArmed = useRef(false);
  const phase = useRef<IntroPhase>('idle');
  const swaps = useRef(0);

  // Worked out during render, not in an effect, so the intro's classes are on
  // it in the same paint the swap happens (see useViewOpening).
  if (isEmpty !== wasEmpty.current) {
    wasEmpty.current = isEmpty;
    swaps.current += 1;
    phase.current =
      wasArmed.current && !prefersReducedMotion() ? (isEmpty ? 'entering' : 'leaving') : 'idle';
  }
  wasArmed.current = isArmed;
  const swap = swaps.current;

  useEffect(() => {
    if (phase.current !== 'leaving') return;
    const timer = setTimeout(() => {
      phase.current = 'idle';
      rerender((n) => n + 1);
    }, exitMs);
    return () => clearTimeout(timer);
  }, [swap, exitMs]);

  return {
    /** the intro is on screen, either as the column's content or on its way out */
    showIntro: isEmpty || phase.current === 'leaving',
    introPhase: phase.current,
  };
}
