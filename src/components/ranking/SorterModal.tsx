import {
  faChevronLeft,
  faChevronRight,
  faCheck,
  faCancel,
} from '@fortawesome/free-solid-svg-icons';
import classNames from 'classnames';
import React from 'react';

import { CountryContestant } from '../../data/CountryContestant';
import { getSortedItems } from '../../utilities/SorterUtils';
import IconButton from '../IconButton';
import Modal from '../modals/Modal';
import { hairline, modalActionBtn } from '../modals/modalStyles';
import TooltipHelp from '../TooltipHelp';
import SorterCompletionList from './sorter/SorterCompletionList';
import useSorterSession from './sorter/useSorterSession';
import SorterContestantCard from './SorterContestantCard';

interface SorterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialItems: CountryContestant[];
}

/*
 * modal component for pairwise comparison sorting. The sorting state machine,
 * history, and caching live in `useSorterSession`; this component renders the UI.
 */
const SorterModal: React.FC<SorterModalProps> = ({ isOpen, onClose, initialItems }) => {
  const {
    categories,
    activeCategory,
    choiceLog,
    isComputing,
    isSessionLoaded,
    currentSortState,
    canInteract,
    progress,
    currentComparison,
    previousChoiceForThisStep,
    canGoBack,
    canGoForward,
    handleChoice,
    handleBack,
    handleForward,
    handleApplyRanking,
  } = useSorterSession(isOpen, onClose, initialItems);

  // --- render ---

  // footer buttons share the modal action sizing. backgrounds and text colors are
  // marked important for the same reason modalActionBtn's utilities are: IconButton
  // emits its own bg and text classes, which would otherwise win.
  const btnBase = classNames(modalActionBtn, 'ring-1 ring-inset disabled:cursor-not-allowed');
  const btnNeutralEnabled =
    '!bg-white/[0.06] hover:!bg-white/[0.12] !text-[var(--er-text-secondary)] hover:!text-[var(--er-text-primary)] ring-white/10';
  const btnNeutralDisabled =
    '!bg-transparent !text-[var(--er-text-subtle)] ring-white/5 opacity-40';
  const btnCancel = classNames(
    btnBase,
    '!bg-transparent hover:!bg-white/[0.06] !text-[var(--er-text-subtle)] hover:!text-[var(--er-text-secondary)] ring-white/10 disabled:opacity-40',
  );
  const btnApply = classNames(
    btnBase,
    '!font-semibold !text-white ring-white/15 shadow-sm shadow-black/30',
    '!bg-gradient-to-b from-white/[0.08] to-transparent',
    '!bg-[var(--er-button-primary)] hover:!bg-[var(--er-button-primary-hover)]',
    'disabled:!bg-white/5 disabled:!text-[var(--er-text-subtle)] disabled:opacity-50 disabled:shadow-none',
  );
  const navBtnClass = (enabled: boolean, extra?: string) =>
    classNames(btnBase, enabled ? btnNeutralEnabled : btnNeutralDisabled, extra);

  // the two choice cards lift slightly under the pointer and pick up an accent ring
  const choiceWrapperClass = classNames(
    'w-full max-w-full min-w-0 cursor-pointer rounded-xl overflow-hidden',
    'transition-[transform,box-shadow] duration-200 ease-out motion-reduce:transition-none',
    canInteract
      ? 'md:hover:-translate-y-0.5 md:hover:shadow-lg md:hover:shadow-black/40 md:hover:ring-2 md:hover:ring-[var(--er-interactive-primary)] active:scale-[0.99] active:ring-2 active:ring-[var(--er-interactive-primary)] motion-reduce:transform-none'
      : 'pointer-events-none opacity-75',
  );

  // placeholder shown while the session loads or can't start
  const statusMessage = (message: string) => (
    <div className="text-center p-8 text-sm text-[var(--er-text-subtle)] min-h-[20em] flex items-center justify-center">
      {message}
    </div>
  );

  let content;
  let comparisonDenominator: number | string = '?';
  if (currentSortState) {
    comparisonDenominator =
      currentSortState.totalComparisons + currentSortState.maxRemainingComparisons;
  }

  // show loading indicators first
  if (isComputing) {
    content = statusMessage('Loading...');
  } else if (isOpen && !isSessionLoaded && initialItems.length > 1) {
    // initializing message
    content = statusMessage('Initializing sorter...');
  } else if (isOpen && initialItems.length <= 1) {
    // message for insufficient items
    content = statusMessage('Need at least two items to sort.');
  } else if (isSessionLoaded && currentSortState?.isComplete) {
    // render completion screen
    const finalRanking = currentSortState ? getSortedItems(currentSortState) : [];

    content = (
      <SorterCompletionList
        finalRanking={finalRanking}
      />
    );
  } else if (isSessionLoaded && currentComparison) {
    // render active comparison screen
    content = (
      <div className="flex flex-col justify-start items-center gap-2 mb-2 min-h-[20em] px-2 pt-2 w-full overflow-hidden min-w-0">
        {/* left choice card */}
        <div onClick={() => handleChoice('left')} className={choiceWrapperClass}>
          <SorterContestantCard
            countryContestant={currentComparison.leftItem}
            showAsPreviousChoice={previousChoiceForThisStep === 'left'}
          />
        </div>

        <div className="flex items-center gap-3 w-full max-w-[14rem] my-1 select-none">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-white/15" />
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10 text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[var(--er-text-subtle)]">
            vs
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-white/15" />
        </div>

        {/* right choice card */}
        <div onClick={() => handleChoice('right')} className={choiceWrapperClass}>
          <SorterContestantCard
            countryContestant={currentComparison.rightItem}
            showAsPreviousChoice={previousChoiceForThisStep === 'right'}
          />
        </div>
      </div>
    );
  } else if (isSessionLoaded) {
    // fallback view if state is indeterminate
    content = statusMessage('Preparing comparison...');
  } else {
    // default view (or null) if modal open but nothing else matches
    content = null;
  }

  // modal structure
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeWarning={'You have unsaved progress. Are you sure you want to close?'}
      shouldCloseWarn={
        isOpen && isSessionLoaded && !currentSortState?.isComplete && choiceLog.length > 0
      }
      className="!max-h-[95vh] w-[calc(100%-2rem)] max-w-2xl sort-tour-step-modal !p-0 overflow-hidden"
    >
      <div className="flex flex-col max-h-[calc(95vh-2rem)] h-full bg-[var(--er-surface-dark)] text-[var(--er-text-primary)] overflow-hidden min-w-0">
        {/* header */}
        <div
          className={classNames(
            'relative flex-shrink-0 px-4 bg-gradient-to-b from-black/30 via-black/10 to-transparent',
            currentSortState?.isComplete ? 'pt-4' : 'pt-5',
          )}
        >
          {/* title and category */}
          <div className={classNames(currentSortState?.isComplete ? 'mb-1' : 'mb-4')}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold tracking-tight leading-tight text-center w-full text-[var(--er-text-primary)]">
                {isSessionLoaded && !currentSortState?.isComplete && (
                  <TooltipHelp
                    content="Answer with your preferences and a ranking will be generated"
                    className="text-[var(--er-text-subtle)] align-middle mb-1 mr-2"
                    place="bottom-start"
                  />
                )}
                {isSessionLoaded && currentSortState?.isComplete
                  ? 'Ranking Complete'
                  : 'Choose Your Preference'}
              </h2>
            </div>
            {activeCategory !== undefined && categories[activeCategory]?.name && (
              <div className="w-full mt-1.5 text-center">
                <span className="inline-flex items-center rounded-full bg-white/[0.06] ring-1 ring-inset ring-white/10 px-2.5 py-0.5 text-xs font-medium text-[var(--er-text-tertiary)]">
                  {categories[activeCategory]?.name}
                </span>
              </div>
            )}
          </div>

          {/* progress bar area */}
          {/* show progress bar only when sorting is active */}
          {!currentSortState?.isComplete && isSessionLoaded && (
            <div className="mb-3">
              <div className="w-full bg-black/25 ring-1 ring-inset ring-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--er-button-primary)] to-[var(--er-interactive-primary)] shadow-[0_0_8px_var(--er-interactive-primary)] transition-[width] duration-500 ease-out motion-reduce:transition-none"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-[0.7rem] text-[var(--er-text-subtle)] text-right mt-1.5 min-h-[1em] tabular-nums">
                {currentSortState ? (
                  <span>
                    Comparisons:{' '}
                    <span className="font-medium text-[var(--er-text-secondary)]">
                      {currentSortState.totalComparisons}
                    </span>{' '}
                    / ~{comparisonDenominator}
                    {isComputing && <span className="ml-2 text-orange-400">(Computing...)</span>}
                  </span>
                ) : (
                  <span> </span> // non-breaking space for placeholder
                )}
              </div>
            </div>
          )}
          {/* maintain space when progress bar is hidden to prevent layout shifts */}
          {currentSortState?.isComplete && <div className="h-[0.5rem]"></div>}
          <div className={classNames(hairline, 'absolute inset-x-0 bottom-0')}></div>
        </div>

        {/* main content (scrollable) */}
        <div
          className={classNames(
            'flex-grow px-0 py-0 pt-0',
            currentSortState?.isComplete ? 'flex flex-col overflow-hidden' : 'overflow-y-auto',
          )}
        >
          {content}
        </div>

        {/* footer buttons */}
        <div className="relative flex-shrink-0 mt-auto px-4 pb-4 pt-3 bg-gradient-to-t from-black/25 to-transparent">
          <div className={classNames(hairline, 'absolute inset-x-0 top-0')}></div>
          {isSessionLoaded && currentSortState?.isComplete ? (
            // footer buttons for completed state
            <div className="flex justify-center items-center gap-3">
              {/* back button (completed) */}
              <IconButton
                onClick={handleBack}
                disabled={!canGoBack || !canInteract}
                className={navBtnClass(canGoBack && canInteract)}
                title="Back"
                icon={faChevronLeft}
              />

              {/* cancel button (completed) */}
              <IconButton
                onClick={onClose}
                disabled={isComputing}
                className={btnCancel}
                title="Cancel"
                icon={faCancel}
              />

              {/* apply button (completed) */}
              <IconButton
                onClick={handleApplyRanking}
                disabled={!canInteract || !currentSortState?.isComplete}
                className={btnApply}
                title="Apply"
                icon={faCheck}
              />

              {/* forward button (completed, conditional) */}
              {/* wrapper to maintain layout width when forward button is hidden */}
              <div className="w-[58px]x flex justify-center">
                {canGoForward && (
                  <IconButton
                    onClick={handleForward}
                    disabled={!canGoForward || !canInteract}
                    className={navBtnClass(canGoForward && canInteract)}
                    title="Forward"
                    icon={faChevronRight}
                  />
                )}
              </div>
            </div>
          ) : (
            // footer buttons for active comparison state
            isSessionLoaded &&
            currentComparison && (
              <div className="flex justify-between items-center mt-1">
                {/* back button area */}
                <div className="w-1/3 flex justify-start">
                  <IconButton
                    onClick={handleBack}
                    disabled={!canGoBack || !canInteract}
                    className={navBtnClass(
                      canGoBack && canInteract,
                      !canGoBack ? 'invisible' : undefined,
                    )}
                    title="Back"
                    icon={faChevronLeft}
                  />
                </div>

                {/* cancel button area */}
                <div className="w-1/3 flex justify-center">
                  <IconButton
                    onClick={onClose}
                    disabled={isComputing}
                    className={btnCancel}
                    title="Cancel"
                    icon={faCancel}
                  />
                </div>

                {/* forward button area */}
                <div className="w-1/3 flex justify-end">
                  <IconButton
                    onClick={handleForward}
                    disabled={!canGoForward || !canInteract}
                    className={navBtnClass(
                      canGoForward && canInteract,
                      !canGoForward ? 'invisible' : undefined,
                    )}
                    title="Forward"
                    icon={faChevronRight}
                  />
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SorterModal;
