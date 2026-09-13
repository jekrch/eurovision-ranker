// @vitest-environment jsdom
import { render, screen, act, fireEvent } from '@testing-library/react';
import React from 'react';
import { ACTIONS, EVENTS, STATUS } from 'react-joyride';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import JoyrideTour from './JoyrideTour';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

// Stands in for the tour overlay so the tests can play the events joyride would
// hand the tour, which is the whole of the contract under test here.
const joyride = vi.hoisted(() => ({
  props: { current: null as Record<string, any> | null },
}));

vi.mock('react-joyride', async () => {
  const actual = await vi.importActual<typeof import('react-joyride')>('react-joyride');

  return {
    ...actual,
    default: (props: Record<string, unknown>) => {
      joyride.props.current = props;

      return null;
    },
  };
});

vi.mock('../utilities/ContestantRepository', () => ({
  fetchCountryContestantsByYear: vi.fn(async () => []),
}));

vi.mock('../utilities/UrlUtil', async () => {
  const actual =
    await vi.importActual<typeof import('../utilities/UrlUtil')>('../utilities/UrlUtil');

  return { ...actual, goToUrl: vi.fn() };
});

function emit(event: Record<string, unknown>): void {
  act(() => {
    (joyride.props.current?.callback as (data: unknown) => void)({
      status: STATUS.RUNNING,
      ...event,
    });
  });
}

async function renderTour() {
  const setRunTour = vi.fn();
  const store = makeTestStore();

  // the first step points at the year picker
  const firstTarget = document.createElement('div');
  firstTarget.className = 'tour-step-1';
  document.body.appendChild(firstTarget);

  render(
    <JoyrideTour
      runTour={true}
      setRunTour={setRunTour}
      setRefreshUrl={vi.fn()}
      openConfigModal={vi.fn()}
      setConfigModalShow={vi.fn()}
    />,
    { wrapper: storeWrapper(store) },
  );

  // the overlay is code-split, and the first step's setup is awaited
  await act(async () => {
    await vi.advanceTimersByTimeAsync(200);
  });

  return { setRunTour };
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
  joyride.props.current = null;
});

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe('JoyrideTour', () => {
  it('asks before letting the user out of the tour', async () => {
    const { setRunTour } = await renderTour();

    emit({ type: EVENTS.STEP_AFTER, action: ACTIONS.CLOSE, index: 3 });

    expect(screen.getByText(/Exit the tour\?/)).toBeDefined();
    expect(setRunTour).not.toHaveBeenCalled();
  });

  it('leaves the tour running when the user decides to stay', async () => {
    const { setRunTour } = await renderTour();

    emit({ type: EVENTS.STEP_AFTER, action: ACTIONS.CLOSE, index: 3 });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Keep going/ }));
    });

    expect(screen.queryByText(/Exit the tour\?/)).toBeNull();
    expect(setRunTour).not.toHaveBeenCalled();
  });

  it('exits once the user confirms', async () => {
    const { setRunTour } = await renderTour();

    emit({ type: EVENTS.STEP_AFTER, action: ACTIONS.CLOSE, index: 3 });
    act(() => {
      fireEvent.click(screen.getByRole('button', { name: /Exit tour/ }));
    });

    expect(setRunTour).toHaveBeenCalledWith(false);
  });

  it('exits without asking once the last step is done', async () => {
    const { setRunTour } = await renderTour();

    emit({ type: EVENTS.TOUR_END, action: ACTIONS.NEXT, index: 17, status: STATUS.FINISHED });

    expect(screen.queryByText(/Exit the tour\?/)).toBeNull();
    expect(setRunTour).toHaveBeenCalledWith(false);
  });

  it('holds its place when a step reports a missing target rather than skipping ahead', async () => {
    const { setRunTour } = await renderTour();

    emit({ type: EVENTS.TARGET_NOT_FOUND, action: ACTIONS.UPDATE, index: 0 });

    expect(joyride.props.current?.stepIndex).toBe(0);
    expect(setRunTour).not.toHaveBeenCalled();
  });
});
