import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import { findTourTarget, waitForTourTarget } from './tourTarget';
import { logger } from '../utilities/logger';

/** how often the watchdog re-checks the target of the step being shown */
const WATCHDOG_POLL_MS = 100;

/**
 * How long the target of the *current* step may stay missing before the tour
 * gives up. Comfortably longer than any of the app's view transitions, so a step
 * whose element is briefly torn down and remounted (switching between the select
 * and list views replaces the whole ranked column) waits rather than bails.
 */
const TARGET_LOST_MS = 4000;

interface TourStep {
  target: string;
}

interface UseTourStepsOptions {
  /** the tour's steps, in order; only the target selector is read here */
  steps: ReadonlyArray<TourStep>;
  /** true while the tour is running */
  running: boolean;
  /**
   * Puts the app into the state the step at `index` describes. Awaited before
   * the step is shown, so anything it dispatches is on screen by then.
   */
  prepareStep: (index: number) => void | Promise<void>;
  /** the tour ran past its last step */
  onFinish: () => void;
  /** a step's target never arrived, or vanished for good; the tour can't continue */
  onAbandon: (index: number) => void;
}

interface UseTourSteps {
  /** the step index to hand react-joyride; only ever a step whose target exists */
  stepIndex: number;
  /** prepare and move to a step. Out-of-range indexes finish the tour. */
  goToStep: (index: number) => void;
}

/**
 * Drives which step a tour is on.
 *
 * react-joyride renders nothing but its overlay for a step whose target isn't in
 * the DOM, and in controlled mode it can't advance past one by itself - the tour
 * is then frozen behind a dark screen with the app left mid-tour, and the only
 * signal is a single "target not found" callback. Skipping ahead on that signal
 * just moves the problem to the next step, whose target usually depends on the
 * one that was skipped.
 *
 * So the index joyride sees is only ever moved to a step that is ready: the
 * step's actions run first, then the target is waited for, and only then is the
 * index committed. A watchdog covers the other direction - a target that goes
 * away while its step is showing - by nudging a re-render when it returns (which
 * is joyride's cue to re-read the DOM) and ending the tour cleanly if it doesn't.
 */
export function useTourSteps({
  steps,
  running,
  prepareStep,
  onFinish,
  onAbandon,
}: UseTourStepsOptions): UseTourSteps {
  const [stepIndex, setStepIndex] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [, forceRender] = useReducer((count: number) => count + 1, 0);

  // read at call time rather than captured, so a step's actions see the latest
  // store values instead of whatever was in scope when the tour started
  const latest = useRef({ steps, prepareStep, onFinish, onAbandon });
  latest.current = { steps, prepareStep, onFinish, onAbandon };

  // bumped by every request so one that has been superseded (a quick Next, or
  // the tour ending mid-prepare) knows to drop its commit
  const requestRef = useRef(0);

  const goToStep = useCallback((index: number) => {
    if (index < 0) {
      return;
    }

    const request = ++requestRef.current;
    const step = latest.current.steps[index];

    if (!step) {
      latest.current.onFinish();

      return;
    }

    const prepareAndShow = async () => {
      setIsPreparing(true);

      try {
        await latest.current.prepareStep(index);
      } catch (error) {
        logger.error(`[tour] step ${index} setup failed`, error);
      }

      if (request !== requestRef.current) {
        return;
      }

      const isReady = await waitForTourTarget(step.target);

      if (request !== requestRef.current) {
        return;
      }

      setIsPreparing(false);

      if (!isReady) {
        logger.warn(`[tour] step ${index} target "${step.target}" never appeared`);
        latest.current.onAbandon(index);

        return;
      }

      setStepIndex(index);
    };

    void prepareAndShow();
  }, []);

  // start at the first step when the tour opens; drop any in-flight request and
  // rewind when it closes, so the next run starts clean
  useEffect(() => {
    if (running) {
      goToStep(0);
    } else {
      requestRef.current++;
      setIsPreparing(false);
      setStepIndex(0);
    }
  }, [running, goToStep]);

  useEffect(() => {
    if (!running || isPreparing) {
      return;
    }

    const selector = latest.current.steps[stepIndex]?.target;

    if (!selector) {
      return;
    }

    let missingSince: number | null = null;

    const intervalId = setInterval(() => {
      if (findTourTarget(selector)) {
        if (missingSince !== null) {
          missingSince = null;
          // joyride re-reads the DOM when it re-renders, and nothing in its own
          // state changed while the element was away
          forceRender();
        }

        return;
      }

      if (missingSince === null) {
        missingSince = Date.now();

        return;
      }

      if (Date.now() - missingSince >= TARGET_LOST_MS) {
        clearInterval(intervalId);
        logger.warn(`[tour] step ${stepIndex} target "${selector}" disappeared`);
        latest.current.onAbandon(stepIndex);
      }
    }, WATCHDOG_POLL_MS);

    return () => clearInterval(intervalId);
  }, [running, isPreparing, stepIndex]);

  return { stepIndex, goToStep };
}
