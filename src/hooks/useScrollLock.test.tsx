// @vitest-environment jsdom
import { render, renderHook } from '@testing-library/react';
import React from 'react';

/**
 * The lock is shared by every modal on screen, so it is re-evaluated per test
 * to keep one test's open modal from holding the lock for the next.
 */
async function loadUseScrollLock() {
  vi.resetModules();
  return (await import('./useScrollLock')).useScrollLock;
}

function scrollOver(element: Element): boolean {
  const event = new Event('wheel', { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event.defaultPrevented;
}

function touchOver(element: Element): boolean {
  const event = new Event('touchmove', { bubbles: true, cancelable: true });
  element.dispatchEvent(event);
  return event.defaultPrevented;
}

function page() {
  const { container } = render(
    <div>
      <div data-testid="background">background content</div>
      <div data-modal-content>
        <span data-testid="modal">modal content</span>
      </div>
      <div className="dropdown-menu">
        <span data-testid="dropdown">dropdown option</span>
      </div>
    </div>,
  );
  const find = (id: string) => container.querySelector(`[data-testid="${id}"]`)!;
  return { background: find('background'), modal: find('modal'), dropdown: find('dropdown') };
}

describe('with a modal open', () => {
  it('holds the page behind the modal still', async () => {
    const useLock = await loadUseScrollLock();
    const { background } = page();
    renderHook(() => useLock(true));

    expect(scrollOver(background)).toBe(true);
  });

  it('lets the modal itself scroll', async () => {
    const useLock = await loadUseScrollLock();
    const { modal } = page();
    renderHook(() => useLock(true));

    expect(scrollOver(modal)).toBe(false);
  });

  it('lets a dropdown opened from the modal scroll', async () => {
    const useLock = await loadUseScrollLock();
    const { dropdown } = page();
    renderHook(() => useLock(true));

    expect(scrollOver(dropdown)).toBe(false);
  });

  it('holds the page still against touch as well as wheel', async () => {
    const useLock = await loadUseScrollLock();
    const { background, modal } = page();
    renderHook(() => useLock(true));

    expect(touchOver(background)).toBe(true);
    expect(touchOver(modal)).toBe(false);
  });
});

describe('with no modal open', () => {
  it('leaves the page scrollable', async () => {
    const useLock = await loadUseScrollLock();
    const { background } = page();
    renderHook(() => useLock(false));

    expect(scrollOver(background)).toBe(false);
  });

  it('leaves the page scrollable again once the modal closes', async () => {
    const useLock = await loadUseScrollLock();
    const { background } = page();
    const { unmount } = renderHook(() => useLock(true));

    unmount();

    expect(scrollOver(background)).toBe(false);
  });
});

describe('with modals layered over each other', () => {
  it('keeps the page held while any modal is still open', async () => {
    const useLock = await loadUseScrollLock();
    const { background } = page();
    renderHook(() => useLock(true));
    const confirmation = renderHook(() => useLock(true));

    confirmation.unmount();

    expect(scrollOver(background)).toBe(true);
  });

  it('releases the page once the last modal closes', async () => {
    const useLock = await loadUseScrollLock();
    const { background } = page();
    const first = renderHook(() => useLock(true));
    const second = renderHook(() => useLock(true));

    second.unmount();
    first.unmount();

    expect(scrollOver(background)).toBe(false);
  });
});

describe('a modal that opens and closes over time', () => {
  it('holds the page only while it is open', async () => {
    const useLock = await loadUseScrollLock();
    const { background } = page();
    const { rerender } = renderHook(({ open }) => useLock(open), {
      initialProps: { open: false },
    });

    expect(scrollOver(background)).toBe(false);

    rerender({ open: true });
    expect(scrollOver(background)).toBe(true);

    rerender({ open: false });
    expect(scrollOver(background)).toBe(false);
  });
});
