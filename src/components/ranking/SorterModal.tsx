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

  // shared sleek button styles — subtle glass surfaces with ring borders,
  // matching the modal shell's aesthetic. only the apply action carries accent.
  const btnBase = 'px-4 py-2 text-sm rounded-lg ring-1 transition-colors duration-150';
  const btnNeutralEnabled =
    'bg-white/5 hover:bg-white/10 text-[var(--er-text-secondary)] ring-white/10';
  const btnNeutralDisabled =
    'bg-transparent text-[var(--er-text-subtle)] ring-white/5 opacity-40 cursor-not-allowed';
  const btnCancel = classNames(
    btnBase,
    'bg-transparent hover:bg-white/10 text-[var(--er-text-secondary)] ring-white/10 disabled:opacity-40 disabled:cursor-not-allowed',
  );
  const btnApply = classNames(
    btnBase,
    'font-semibold text-white shadow-sm ring-white/10',
    'bg-[var(--er-accent-success)] hover:bg-[var(--er-accent-success)] hover:brightness-110',
    'disabled:bg-white/5 disabled:text-[var(--er-text-subtle)] disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed',
  );
  const navBtnClass = (enabled: boolean, extra?: string) =>
    classNames(btnBase, enabled ? btnNeutralEnabled : btnNeutralDisabled, extra);

  let content;
  let comparisonDenominator: number | string = '?';
  if (currentSortState) {
    comparisonDenominator =
      currentSortState.totalComparisons + currentSortState.maxRemainingComparisons;
  }

  // show loading indicators first
  if (isComputing) {
    content = (
      <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">
        Loading...
      </div>
    );
  } else if (isOpen && !isSessionLoaded && initialItems.length > 1) {
    // initializing message
    content = (
      <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">
        Initializing sorter...
      </div>
    );
  } else if (isOpen && initialItems.length <= 1) {
    // message for insufficient items
    content = (
      <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">
        Need at least two items to sort.
      </div>
    );
  } else if (isSessionLoaded && currentSortState?.isComplete) {
    // render completion screen
    const finalRanking = currentSortState ? getSortedItems(currentSortState) : [];

    content = (
      <SorterCompletionList
        totalComparisons={currentSortState.totalComparisons}
        finalRanking={finalRanking}
      />
    );
  } else if (isSessionLoaded && currentComparison) {
    // render active comparison screen
    content = (
      <div className="flex flex-col justify-start items-center gap-2 mb-2 min-h-[20em] px-[0.1em] pt-1 w-full overflow-hidden min-w-0">
        {/* left choice card */}
        <div
          onClick={() => handleChoice('left')}
          className={classNames(
            'w-full max-w-full cursor-pointer transition-colors duration-200 rounded-lg overflow-hidden min-w-0',
            {
              'md:hover:ring-2 md:hover:ring-[var(--r-accent-ring)] active:ring-2 active:ring-[var(--r-accent-ring)]':
                canInteract,
            },
            { 'pointer-events-none opacity-75': !canInteract },
          )}
        >
          <SorterContestantCard
            countryContestant={currentComparison.leftItem}
            showAsPreviousChoice={previousChoiceForThisStep === 'left'}
          />
        </div>

        <div className="flex items-center gap-3 w-full max-w-[14rem] my-1 select-none">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-[var(--er-border-subtle)]" />
          <span className="text-[0.7rem] font-semibold uppercase tracking-[0.25em] text-[var(--er-text-tertiary)]">
            vs
          </span>
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-[var(--er-border-subtle)]" />
        </div>

        {/* right choice card */}
        <div
          onClick={() => handleChoice('right')}
          className={classNames(
            'w-full max-w-full cursor-pointer transition-colors duration-200 rounded-lg overflow-hidden',
            {
              'md:hover:ring-2 md:hover:ring-[var(--r-accent-ring)] active:ring-2 active:ring-[var(--r-accent-ring)]':
                canInteract,
            },
            { 'pointer-events-none opacity-75': !canInteract },
          )}
        >
          <SorterContestantCard
            countryContestant={currentComparison.rightItem}
            showAsPreviousChoice={previousChoiceForThisStep === 'right'}
          />
        </div>
      </div>
    );
  } else if (isSessionLoaded) {
    // fallback view if state is indeterminate
    content = (
      <div className="text-center p-8 text-[var(--er-text-tertiary)] min-h-[20em] flex items-center justify-center">
        Preparing comparison...
      </div>
    );
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
      className="!max-h-[95vh] w-[calc(100%-2rem)] max-w-2xl sort-tour-step-modal px-0 py-1"
    >
      <div className="flex flex-col max-h-[calc(95vh-2rem)] h-full bg-[var(--er-surface-dark)] text-[var(--er-text-primary)] overflow-hidden min-w-0">
        {/* header */}
        <div
          className={classNames(
            'flex-shrink-0 px-4',
            currentSortState?.isComplete ? 'pt-1' : 'pt-3',
          )}
        >
          {/* title and category */}
          <div className={classNames(currentSortState?.isComplete ? 'mb-1' : 'mb-4')}>
            <div className="flex items-center justify-between">
              <h2
                className={classNames(
                  'text-xl font-bold text-center w-full text-[var(--er-text-secondary)]',
                )}
              >
                {isSessionLoaded && !currentSortState?.isComplete && (
                  <TooltipHelp
                    content="Answer with your preferences and a ranking will be generated"
                    className="text-[var(--er-text-secondary)] align-middle mb-1 mr-2"
                    place="bottom-start"
                  />
                )}
                {isSessionLoaded && currentSortState?.isComplete
                  ? 'Ranking Complete'
                  : 'Choose Your Preference'}
              </h2>
            </div>
            {activeCategory !== undefined && categories[activeCategory]?.name && (
              <div className="items-center w-full mb-0 text-center text-[var(--er-text-tertiary)] text-sm">
                {categories[activeCategory]?.name}
              </div>
            )}
          </div>

          {/* progress bar area */}
          {/* show progress bar only when sorting is active */}
          {!currentSortState?.isComplete && isSessionLoaded && (
            <div className="mb-3">
              <div className="w-full bg-white/5 ring-1 ring-white/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--er-interactive-primary)] transition-[width] duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-xs text-[var(--er-text-tertiary)] text-right mt-1 min-h-[1em]">
                {currentSortState ? (
                  <span>
                    Comparisons: {currentSortState.totalComparisons} / ~{comparisonDenominator}
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
        <div className="flex-shrink-0 mt-auto px-4 pb-3 pt-3 border-t border-[var(--er-border-subtle)]">
          {isSessionLoaded && currentSortState?.isComplete ? (
            // footer buttons for completed state
            <div className="flex justify-center items-center space-x-4">
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
