// @vitest-environment jsdom
import { fireEvent, render, screen, within } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import WelcomeOverlay from './WelcomeOverlay';
import { makeTestStore, storeWrapper } from '../../test/storeHarness';

function renderOverlay({ exiting = false } = {}) {
  const store = makeTestStore();
  const handleGetStarted = vi.fn();
  const handleTakeTour = vi.fn();
  const utils = render(
    <WelcomeOverlay
      exiting={exiting}
      handleGetStarted={handleGetStarted}
      handleTakeTour={handleTakeTour}
    />,
    { wrapper: storeWrapper(store) },
  );
  return { ...utils, store, handleGetStarted, handleTakeTour };
}

function cardButtons() {
  return within(screen.getByRole('dialog')).getAllByRole('button');
}

describe('WelcomeOverlay', () => {
  it('marks the overlay as open while it is shown', () => {
    const { store } = renderOverlay();

    expect(store.getState().root.welcomeOverlayIsOpen).toBe(true);
  });

  it('puts focus on Get started when it appears', () => {
    renderOverlay();

    expect(document.activeElement).toBe(screen.getByRole('button', { name: /get started/i }));
  });

  it('highlights the contest name in the ESC Asia row', () => {
    const { container } = renderOverlay();

    expect(container.querySelector('.welcome-shimmer')?.textContent).toBe('Asia');
  });

  it('fades the backdrop out while exiting', () => {
    const { container } = renderOverlay({ exiting: true });

    const backdrops = [...container.querySelectorAll('.overlay-bg')];
    expect(backdrops).toHaveLength(3);
    backdrops.forEach((el) => expect(el.className).toContain('opacity-0'));
  });

  it('starts the tour from Take the tour', () => {
    const { handleTakeTour, handleGetStarted } = renderOverlay();

    fireEvent.click(screen.getByRole('button', { name: /take the tour/i }));

    expect(handleTakeTour).toHaveBeenCalledTimes(1);
    expect(handleGetStarted).not.toHaveBeenCalled();
  });

  it('closes when Escape is pressed', () => {
    const { store, handleGetStarted } = renderOverlay();

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(store.getState().root.welcomeOverlayIsOpen).toBe(false);
    expect(handleGetStarted).toHaveBeenCalledTimes(1);
  });

  it('ignores keys other than Escape and Tab', () => {
    const { handleGetStarted } = renderOverlay();

    fireEvent.keyDown(window, { key: 'Enter' });

    expect(handleGetStarted).not.toHaveBeenCalled();
  });

  it('closes when the backdrop is clicked', () => {
    const { handleGetStarted } = renderOverlay();

    fireEvent.click(screen.getByRole('dialog').parentElement!);

    expect(handleGetStarted).toHaveBeenCalledTimes(1);
  });

  it('stays open when the card itself is clicked', () => {
    const { handleGetStarted } = renderOverlay();

    fireEvent.click(screen.getByRole('dialog'));

    expect(handleGetStarted).not.toHaveBeenCalled();
  });

  it('wraps Tab from the last button back to the first', () => {
    renderOverlay();
    const buttons = cardButtons();
    buttons.at(-1)!.focus();

    fireEvent.keyDown(window, { key: 'Tab' });

    expect(document.activeElement).toBe(buttons[0]);
  });

  it('wraps Shift+Tab from the first button to the last', () => {
    renderOverlay();
    const buttons = cardButtons();
    buttons[0].focus();

    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

    expect(document.activeElement).toBe(buttons.at(-1));
  });

  it('leaves Tab alone between buttons in the middle of the card', () => {
    renderOverlay();
    const buttons = cardButtons();
    expect(buttons.length).toBeGreaterThan(2);
    const middle = buttons[1];
    middle.focus();

    const notCancelled = fireEvent.keyDown(window, { key: 'Tab' });
    const notCancelledShift = fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });

    expect(notCancelled).toBe(true);
    expect(notCancelledShift).toBe(true);
    expect(document.activeElement).toBe(middle);
  });

  it('pulls focus back into the card when it has escaped', () => {
    renderOverlay();
    const buttons = cardButtons();
    const outside = document.createElement('button');
    document.body.appendChild(outside);

    outside.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(document.activeElement).toBe(buttons[0]);

    outside.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(buttons.at(-1));

    outside.remove();
  });

  it('stops listening for keys once it is gone', () => {
    const { unmount, handleGetStarted } = renderOverlay();

    unmount();
    fireEvent.keyDown(window, { key: 'Escape' });

    expect(handleGetStarted).not.toHaveBeenCalled();
  });

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
