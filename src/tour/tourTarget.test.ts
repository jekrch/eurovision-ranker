// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { findTourTarget, waitForTourTarget } from './tourTarget';

function addTarget(className: string): HTMLElement {
  const element = document.createElement('div');
  element.className = className;
  document.body.appendChild(element);

  return element;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('findTourTarget', () => {
  it('finds the element a step points at', () => {
    const target = addTarget('tour-step-1');

    expect(findTourTarget('.tour-step-1')).toBe(target);
  });

  it('reports nothing for a step whose element is not on the page', () => {
    expect(findTourTarget('.tour-step-1')).toBeNull();
  });

  it('reports nothing for an element hidden by an ancestor', () => {
    const wrapper = addTarget('wrapper');
    wrapper.style.display = 'none';
    const target = document.createElement('div');
    target.className = 'tour-step-1';
    wrapper.appendChild(target);

    expect(findTourTarget('.tour-step-1')).toBeNull();
  });
});

describe('waitForTourTarget', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('is satisfied right away by an element that is already there', async () => {
    addTarget('tour-step-1');

    await expect(waitForTourTarget('.tour-step-1', 1000)).resolves.toBe(true);
  });

  it('waits for an element the app has yet to render', async () => {
    const pending = waitForTourTarget('.tour-step-1', 1000);

    await vi.advanceTimersByTimeAsync(200);
    addTarget('tour-step-1');
    await vi.advanceTimersByTimeAsync(100);

    await expect(pending).resolves.toBe(true);
  });

  it('gives up on an element that never arrives', async () => {
    const pending = waitForTourTarget('.tour-step-1', 500);

    await vi.advanceTimersByTimeAsync(600);

    await expect(pending).resolves.toBe(false);
  });
});
