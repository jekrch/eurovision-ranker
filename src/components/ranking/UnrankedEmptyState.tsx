import { faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import classNames from 'classnames';
import React from 'react';

interface UnrankedEmptyStateProps {
  /** true while a card is being dragged over the column */
  isDraggingOver: boolean;
  onShowRanking?: () => void;
  onOpenGlobalSearch?: () => void;
}

const buttonClassName =
  'w-full rounded-md border-[0.1em] border-[var(--er-border-tertiary)] px-2 py-2 text-xs ' +
  'font-bold text-[var(--er-text-secondary)] hover:bg-[var(--er-interactive-dark)] ' +
  'hover:text-[var(--er-text-primary)] transition-colors';

/**
 * What the selection column shows once every country has been ranked. It sits
 * inside the column's droppable, so it doubles as the target for dragging a
 * country back out of the ranking, and it points on to the next steps.
 */
const UnrankedEmptyState: React.FC<UnrankedEmptyStateProps> = ({
  isDraggingOver,
  onShowRanking,
  onOpenGlobalSearch,
}) => (
  <div className="m-2">
    <div
      className={classNames(
        'flex flex-col items-center gap-2 rounded-md border-2 border-dashed px-2 py-4 text-center',
        'max-w-[10em] mx-auto transition-colors',
        isDraggingOver
          ? 'border-[var(--er-border-primary)] bg-[var(--er-surface-bar)] bg-opacity-40'
          : 'border-[var(--er-border-tertiary)]',
      )}
    >
      <FontAwesomeIcon className="text-2xl text-[var(--er-text-tertiary)]" icon={faCircleCheck} />
      <div className="text-sm font-bold text-[var(--er-text-secondary)]">
        All countries ranked
      </div>
      <div className="text-xs text-[var(--er-text-subtle)] whitespace-normal">
        Drag a country here to unrank it
      </div>
      {(onShowRanking || onOpenGlobalSearch) && (
        <div className="mt-1 flex w-full flex-col gap-2">
          {onShowRanking && (
            <button type="button" className={buttonClassName} onClick={onShowRanking}>
              View ranking
            </button>
          )}
          {onOpenGlobalSearch && (
            <button type="button" className={buttonClassName} onClick={onOpenGlobalSearch}>
              Add from other years
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

export default UnrankedEmptyState;
