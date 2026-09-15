// @vitest-environment jsdom
import { act, fireEvent, render, screen } from '@testing-library/react';
import React from 'react';

import Modal from './Modal';

/** Opening and closing are animated, so time is controlled in these tests. */
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

const settle = () => act(() => void vi.advanceTimersByTime(400));

function open(props: Partial<React.ComponentProps<typeof Modal>> = {}) {
  const onClose = vi.fn();
  const result = render(
    <Modal isOpen onClose={onClose} {...props}>
      <p>modal body</p>
    </Modal>,
  );
  settle();
  return { onClose, ...result };
}

describe('an open modal', () => {
  it('shows its content', () => {
    open();

    expect(screen.getByText('modal body')).toBeTruthy();
  });

  it('closes when its close button is used', () => {
    const { onClose } = open();

    fireEvent.click(screen.getByLabelText('Close modal'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes when the page behind it is clicked', () => {
    const { onClose } = open();

    fireEvent.mouseDown(document.body);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when its own content is clicked', () => {
    const { onClose } = open();

    fireEvent.mouseDown(screen.getByText('modal body'));

    expect(onClose).not.toHaveBeenCalled();
  });

  it('stays open when a dropdown it opened is clicked', () => {
    const { onClose } = open();
    const dropdown = document.createElement('div');
    dropdown.className = 'dropdown-menu';
    document.body.appendChild(dropdown);

    fireEvent.mouseDown(dropdown);

    expect(onClose).not.toHaveBeenCalled();
    dropdown.remove();
  });

  it('stays open when the floating video player is clicked', () => {
    const { onClose } = open();
    const player = document.createElement('div');
    player.className = 'er-video-player-root';
    document.body.appendChild(player);

    fireEvent.mouseDown(player);

    expect(onClose).not.toHaveBeenCalled();
    player.remove();
  });
});

describe('a closed modal', () => {
  it('shows nothing', () => {
    render(
      <Modal isOpen={false} onClose={vi.fn()}>
        <p>modal body</p>
      </Modal>,
    );

    expect(screen.queryByText('modal body')).toBeNull();
  });

  it('stops listening for clicks on the page behind it', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen onClose={onClose}>
        <p>modal body</p>
      </Modal>,
    );
    settle();

    rerender(
      <Modal isOpen={false} onClose={onClose}>
        <p>modal body</p>
      </Modal>,
    );
    settle();
    fireEvent.mouseDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('a modal holding unsaved work', () => {
  const warning = { closeWarning: 'You have unsaved changes', shouldCloseWarn: true };

  it('asks before closing rather than closing straight away', () => {
    const { onClose } = open(warning);

    fireEvent.click(screen.getByLabelText('Close modal'));
    settle();

    expect(screen.getByText('You have unsaved changes')).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes once the warning is accepted', () => {
    const { onClose } = open(warning);
    fireEvent.click(screen.getByLabelText('Close modal'));
    settle();

    fireEvent.click(screen.getByText('Confirm'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('stays open when the warning is dismissed', () => {
    const { onClose } = open(warning);
    fireEvent.click(screen.getByLabelText('Close modal'));
    settle();

    fireEvent.click(screen.getByText('Cancel'));
    settle();

    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByText('modal body')).toBeTruthy();
  });

  it('ignores clicks on the page behind it while the warning is up', () => {
    const { onClose } = open(warning);
    fireEvent.click(screen.getByLabelText('Close modal'));
    settle();

    fireEvent.mouseDown(document.body);

    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes straight away when there is nothing to lose', () => {
    const { onClose } = open({ closeWarning: 'You have unsaved changes' });

    fireEvent.click(screen.getByLabelText('Close modal'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('a modal with a decorative backdrop', () => {
  it('shows the decoration behind its content', () => {
    open({ backdropContent: <div data-testid="confetti" /> });

    expect(screen.getByTestId('confetti')).toBeTruthy();
  });
});
