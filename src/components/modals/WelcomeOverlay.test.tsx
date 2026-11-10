// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import WelcomeOverlay from './WelcomeOverlay';
import { makeTestStore, storeWrapper } from '../../test/storeHarness';

function renderOverlay() {
  const store = makeTestStore();
  const handleGetStarted = vi.fn();
  render(
    <WelcomeOverlay exiting={false} handleGetStarted={handleGetStarted} handleTakeTour={vi.fn()} />,
    { wrapper: storeWrapper(store) },
  );
  return { store, handleGetStarted };
}

describe('WelcomeOverlay', () => {
  it('opens Eurovision Asia 2026 and closes from the Asia button', () => {
    const { store, handleGetStarted } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: 'Rank ESC Asia 2026' }));

    expect(store.getState().root.contest).toBe('asia');
    expect(store.getState().root.year).toBe('2026');
    expect(store.getState().root.welcomeOverlayIsOpen).toBe(false);
    expect(handleGetStarted).toHaveBeenCalledTimes(1);
  });

  it('stays on the traditional contest from Get started', () => {
    const { store, handleGetStarted } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));

    expect(store.getState().root.contest).toBe('esc');
    expect(handleGetStarted).toHaveBeenCalledTimes(1);
  });

  it('ignores the Asia button once the card is already closing', () => {
    const { store, handleGetStarted } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: /get started/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Rank ESC Asia 2026' }));

    expect(store.getState().root.contest).toBe('esc');
    expect(handleGetStarted).toHaveBeenCalledTimes(1);
  });
});
