// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import PipControlBar from './PipControlBar';

function controls(props: Partial<React.ComponentProps<typeof PipControlBar>> = {}) {
  const handlers = {
    onBarPointerDown: vi.fn(),
    navigate: vi.fn(),
    toggleAutoContinue: vi.fn(),
    expand: vi.fn(),
    closePip: vi.fn(),
  };
  render(<PipControlBar autoContinue={false} {...handlers} {...props} />);
  return handlers;
}

const click = (label: string) => fireEvent.click(screen.getByLabelText(label));

describe('the floating player controls', () => {
  it('moves to the next video', () => {
    const { navigate } = controls();

    click('Next video');

    expect(navigate).toHaveBeenCalledWith(1);
  });

  it('moves to the previous video', () => {
    const { navigate } = controls();

    click('Previous video');

    expect(navigate).toHaveBeenCalledWith(-1);
  });

  it('returns the video to the tab it came from', () => {
    const { expand } = controls();

    click('Return to tab');

    expect(expand).toHaveBeenCalledTimes(1);
  });

  it('closes the player', () => {
    const { closePip } = controls();

    click('Close video');

    expect(closePip).toHaveBeenCalledTimes(1);
  });

  it('can be dragged by its bar', () => {
    const { onBarPointerDown } = controls();

    fireEvent.pointerDown(screen.getByTitle('Drag to move'));

    expect(onBarPointerDown).toHaveBeenCalledTimes(1);
  });
});

describe('playing through a ranking automatically', () => {
  it('turns on when asked', () => {
    const { toggleAutoContinue } = controls();

    click('Autoplay next video');

    expect(toggleAutoContinue).toHaveBeenCalledTimes(1);
  });

  it('shows as off until it is turned on', () => {
    controls();

    expect(screen.getByLabelText('Autoplay next video').getAttribute('aria-pressed')).toBe('false');
  });

  it('shows as on once it is turned on', () => {
    controls({ autoContinue: true });

    const toggle = screen.getByLabelText('Autoplay next video');
    expect(toggle.getAttribute('aria-pressed')).toBe('true');
    expect(toggle.getAttribute('title')).toBe('Auto-continue on');
  });
});
