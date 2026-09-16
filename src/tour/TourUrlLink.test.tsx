// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import TourUrlLink from './TourUrlLink';

const writeText = vi.fn(async () => {});

beforeEach(() => {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  });
  writeText.mockClear();
  window.history.replaceState(null, '', '/?n=Sigrit&y=23&r=abc');
});

const click = async () =>
  act(async () => {
    fireEvent.click(screen.getByRole('button'));
  });

describe('the tour step that points at the URL', () => {
  it('shows the address of the ranking that is on screen', async () => {
    render(<TourUrlLink />);

    expect(screen.getByRole('button').textContent).toBe(
      `${window.location.host}?n=Sigrit&y=23&r=abc`,
    );
  });

  it('copies a link that can be pasted somewhere, protocol and all', async () => {
    render(<TourUrlLink />);

    await click();

    expect(writeText).toHaveBeenCalledWith(window.location.href);
  });

  it('says so once the link has been copied', async () => {
    render(<TourUrlLink />);

    expect(screen.queryByText('Copied!')).toBeNull();

    await click();

    expect(screen.getByText('Copied!')).toBeDefined();
  });
});
