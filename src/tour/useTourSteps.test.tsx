// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { useTourSteps } from './useTourSteps';

const steps = [{ target: '.step-a' }, { target: '.step-b' }, { target: '.step-c' }];

function showTarget(className: string): void {
  const element = document.createElement('div');
  element.className = className;
  document.body.appendChild(element);
}

function hideTarget(className: string): void {
  document.querySelector(`.${className}`)?.remove();
}

/** lets the awaited setup and the target poll settle */
async function settle(ms = 200): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

function renderTour(overrides: Partial<Parameters<typeof useTourSteps>[0]> = {}) {
  const prepareStep = vi.fn();
  const onFinish = vi.fn();
  const onAbandon = vi.fn();

  const utils = renderHook(() =>
    useTourSteps({ steps, running: true, prepareStep, onFinish, onAbandon, ...overrides }),
  );

  return { ...utils, prepareStep, onFinish, onAbandon };
}

beforeEach(() => {
  vi.useFakeTimers();
  document.body.innerHTML = '';
  vi.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('useTourSteps', () => {
  it('opens the tour on its first step', async () => {
    showTarget('step-a');
    const { result } = renderTour();

    await settle();

    expect(result.current.stepIndex).toBe(0);
  });

  it('sets a step up before showing it', async () => {
    const prepareStep = vi.fn((index: number) => {
      if (index === 1) {
        showTarget('step-b');
      }
    });
    showTarget('step-a');
    const { result } = renderTour({ prepareStep });

    await settle();
    act(() => result.current.goToStep(1));
    await settle();

    expect(prepareStep).toHaveBeenCalledWith(1);
    expect(result.current.stepIndex).toBe(1);
  });

  it('stays on the current step while the next one has nothing to point at', async () => {
    showTarget('step-a');
    const { result } = renderTour();

    await settle();
    act(() => result.current.goToStep(1));
    await settle(500);

    expect(result.current.stepIndex).toBe(0);
  });

  it('moves on as soon as the next step has something to point at', async () => {
    showTarget('step-a');
    const { result } = renderTour();

    await settle();
    act(() => result.current.goToStep(1));
    await settle(500);

    showTarget('step-b');
    await settle();

    expect(result.current.stepIndex).toBe(1);
  });

  it('ends the tour once it runs past the last step', async () => {
    showTarget('step-a');
    const { result, onFinish } = renderTour();

    await settle();
    act(() => result.current.goToStep(steps.length));
    await settle();

    expect(onFinish).toHaveBeenCalled();
  });

  it('gives up on a step whose target never arrives', async () => {
    showTarget('step-a');
    const { result, onAbandon } = renderTour();

    await settle();
    act(() => result.current.goToStep(1));
    await settle(5000);

    expect(onAbandon).toHaveBeenCalledWith(1);
  });

  it('gives up when the step being shown loses the element it points at', async () => {
    showTarget('step-a');
    const { onAbandon } = renderTour();

    await settle();
    hideTarget('step-a');
    await settle(6000);

    expect(onAbandon).toHaveBeenCalledWith(0);
  });

  it('rides out a step whose element is only briefly remounted', async () => {
    showTarget('step-a');
    const { onAbandon } = renderTour();

    await settle();
    hideTarget('step-a');
    await settle(500);
    showTarget('step-a');
    await settle(6000);

    expect(onAbandon).not.toHaveBeenCalled();
  });

  it('drops a step request that a later one has overtaken', async () => {
    showTarget('step-a');
    showTarget('step-c');
    const { result } = renderTour();

    await settle();
    act(() => {
      result.current.goToStep(1);
      result.current.goToStep(2);
    });
    await settle(500);

    // step 1 never got a target, but it lost ownership of the tour to step 2
    expect(result.current.stepIndex).toBe(2);
  });

  it('rewinds to the first step when the tour closes', async () => {
    showTarget('step-a');
    showTarget('step-b');
    const { result, rerender } = renderHook(
      ({ running }) =>
        useTourSteps({
          steps,
          running,
          prepareStep: vi.fn(),
          onFinish: vi.fn(),
          onAbandon: vi.fn(),
        }),
      { initialProps: { running: true } },
    );

    await settle();
    act(() => result.current.goToStep(1));
    await settle();
    expect(result.current.stepIndex).toBe(1);

    rerender({ running: false });
    await settle();

    expect(result.current.stepIndex).toBe(0);
  });
});
