import React from 'react';
import { createPortal } from 'react-dom';

import IconButton from '../components/IconButton';
import { JOYRIDE_TOOLTIP_Z_INDEX } from '../utilities/JoyrideUtil';

/**
 * Above every piece of the tour, including the step tooltip, which joyride
 * stacks higher than its overlay. The shared Modal can't be used for this: it
 * renders at z-50, so the tour's own overlay would cover it.
 */
const EXIT_PROMPT_Z_INDEX = JOYRIDE_TOOLTIP_Z_INDEX + 10;

/**
 * Surfaces that stay open for the tour recognise the tour's own chrome by a
 * `react-joyride` id prefix and don't treat a click on it as a click away (the
 * ranked header menu, which several steps point into, is the one that matters).
 * This prompt is tour chrome too, so it identifies itself the same way.
 */
const EXIT_PROMPT_ID = 'react-joyride-tour-exit-prompt';

interface TourExitPromptProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Asks before a tour is abandoned. Exiting reloads the page to put the ranking
 * the user had before the tour back, so it's worth a beat of confirmation -
 * especially since a stray click on the overlay or a press of Escape is an exit
 * as far as joyride is concerned.
 */
const TourExitPrompt: React.FC<TourExitPromptProps> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) {
    return null;
  }

  return createPortal(
    <div
      id={EXIT_PROMPT_ID}
      className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
      style={{ zIndex: EXIT_PROMPT_Z_INDEX }}
      role="alertdialog"
      aria-modal="true"
      aria-label="Exit the tour?"
    >
      <div className="w-full max-w-[22em] rounded-xl bg-[var(--er-surface-secondary)] p-6 text-[var(--er-text-tertiary)] ring-1 ring-white/10 shadow-2xl shadow-black/40">
        <div className="mb-4 text-sm text-[var(--er-text-secondary)] leading-[1.2em]">
          Exit the tour? The ranking you had before it started will be restored.
        </div>
        <div className="flex justify-end">
          <IconButton onClick={onConfirm} title="Exit tour" />
          <IconButton className="ml-2" onClick={onCancel} title="Keep going" isGrayTheme={true} />
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default TourExitPrompt;
