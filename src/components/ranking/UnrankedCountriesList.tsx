import { Draggable } from '@hello-pangea/dnd';
import classNames from 'classnames';
import React, { CSSProperties, useLayoutEffect, useRef } from 'react';

import { Card } from './Card';
import PhantomArrow from './PhantomArrow';
import { StrictModeDroppable } from './StrictModeDroppable';
import UnrankedEmptyState from './UnrankedEmptyState';
import { CountryContestant } from '../../data/CountryContestant';
import { useAppSelector } from '../../hooks/stateHooks';
import { useArrivals } from '../../hooks/useArrivals';
import { useIntroSwap } from '../../hooks/useIntroSwap';
import { RankingAddition, useRecentlyAdded } from '../../hooks/useRecentlyAdded';
import { useViewOpening } from '../../hooks/useViewOpening';
import { useWidthMorph } from '../../hooks/useWidthMorph';
import { selectActiveRankedItems } from '../../redux/rankingSelectors';
import { AppState } from '../../redux/store';
import { staggerStyle } from '../../utilities/animationUtil';

interface UnrankedCountriesListProps {
  onAddToRanked?: (item: CountryContestant) => void;
  /** the country most recently removed from the ranking in delete mode */
  latestReturn?: RankingAddition | null;
  /** true while every row is leaving for the ranking (see useBulkMove) */
  isAddingAll?: boolean;
  /** whether Add All or Clear is moving the whole ranking (see useBulkMove) */
  isBulkMoving?: () => boolean;
  /** shown once every country is ranked (see UnrankedEmptyState) */
  onShowRanking?: () => void;
  onOpenGlobalSearch?: () => void;
}

const NOT_MOVING = () => false;

/** Mirrors `--er-empty-leave-duration` in transitions.css. */
const EMPTY_LEAVE_MS = 150;

/**
 * How long after the all-ranked state starts leaving the rows coming back still
 * wait on it. It covers the longest a returned row keeps its entrance class
 * (see useArrivals); letting the lead lapse any sooner would shift a running
 * entrance.
 */
const HANDOFF_WINDOW_MS = 1000;

const HANDOFF_STYLE = { '--er-arrival-lead': 'var(--er-empty-handoff)' } as CSSProperties;

/**
 * displays all ranked countries in the left column list on the select view
 */
const UnrankedCountriesList: React.FC<UnrankedCountriesListProps> = ({
  onAddToRanked,
  latestReturn = null,
  isAddingAll = false,
  isBulkMoving = NOT_MOVING,
  onShowRanking,
  onOpenGlobalSearch,
}) => {
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const welcomeOverlayIsOpen = useAppSelector((state: AppState) => state.root.welcomeOverlayIsOpen);
  const isOpening = useViewOpening(unrankedItems.length > 0);
  const wasRecentlyReturned = useRecentlyAdded(latestReturn);
  const isMoving = isBulkMoving();
  // Clear's countries come back from the ranking in turn, the rows that were
  // never ranked staying where they are.
  const arrivalOrder = useArrivals(unrankedItems.map((item) => item.id.toString()), isMoving);
  // an empty column with nothing ranked is still loading its year, not finished
  const isAllRanked = unrankedItems.length === 0 && rankedItems.length > 0;
  // The all-ranked state steps aside for the first country back, the way the
  // ranked column's intro does for the first country in. Until either column has
  // had countries in it the year is still loading, and that isn't animated.
  const { showIntro: showEmptyState, introPhase: emptyStatePhase } = useIntroSwap(
    isAllRanked,
    unrankedItems.length > 0 || rankedItems.length > 0,
    EMPTY_LEAVE_MS,
  );

  // The width the all-ranked state had in the flow. It keeps that width on its
  // way out: left to the column, it would squeeze to fit the country coming
  // back before it had gone anywhere.
  const emptyStateRef = useRef<HTMLDivElement>(null);
  const emptyStateWidth = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (emptyStatePhase !== 'leaving' && emptyStateRef.current) {
      emptyStateWidth.current = emptyStateRef.current.offsetWidth;
    }
  });

  // Worked out during render so the lead is on the rows in the same paint
  // their entrance starts (see useViewOpening).
  const leftAt = useRef<number | null>(null);
  const wasLeaving = useRef(false);
  if (emptyStatePhase === 'leaving' && !wasLeaving.current) leftAt.current = Date.now();
  wasLeaving.current = emptyStatePhase === 'leaving';
  const isHandingOff = leftAt.current !== null && Date.now() - leftAt.current < HANDOFF_WINDOW_MS;
  const columnRef = useWidthMorph<HTMLDivElement>(
    unrankedItems.length,
    isMoving || emptyStatePhase !== 'idle',
  );

  return (
    <div
      ref={columnRef}
      className="min-w-[10em] max-w-[40vw] overflow-y-auto overflow-x-hidden flex-grow mr-0 relative flex flex-col"
    >
      <StrictModeDroppable droppableId="unrankedItems" key={`strict-md`}>
        {(provided, droppableSnapshot) => (
          <ul
            key={`ranked-list-${unrankedItems.length}`}
            {...provided.droppableProps}
            ref={provided.innerRef}
            // grows to the column's full height so a card can be dropped
            // anywhere in the column, not just over the rows it already has
            className={classNames('relative pt-[0.3em] min-w-[10em] flex-grow tour-step-2', '')}
            style={isHandingOff ? HANDOFF_STYLE : undefined}
          >
            {/* On its way out the all-ranked state is lifted out of the flow at
                the width it had, so the country coming back takes the top of
                the column at once rather than landing below it and jumping up,
                and the column narrowing for that country doesn't squeeze it.
                The entrance is on this wrapper rather than inside the state
                because the list remounts when its length changes, and the
                entrance would replay under the exit. */}
            {showEmptyState && (
              <div
                ref={emptyStateRef}
                className={classNames(
                  emptyStatePhase === 'leaving'
                    ? 'unranked-empty-leave-animation absolute left-0 top-[0.3em]'
                    : 'view-item-enter-animation',
                )}
                style={
                  emptyStatePhase === 'leaving' && emptyStateWidth.current !== null
                    ? { width: emptyStateWidth.current }
                    : undefined
                }
              >
                <UnrankedEmptyState
                  isDraggingOver={droppableSnapshot.isDraggingOver}
                  onShowRanking={onShowRanking}
                  onOpenGlobalSearch={onOpenGlobalSearch}
                />
              </div>
            )}
            {unrankedItems.map((item, index) => {
              const arrival = arrivalOrder(item.id.toString());
              const hasArrived = !isAddingAll && arrival !== undefined;
              const wasReturned =
                !isOpening &&
                !isAddingAll &&
                !hasArrived &&
                wasRecentlyReturned(item.id.toString());
              return (
                <Draggable
                  key={item.id.toString()}
                  draggableId={item.id.toString()}
                  index={index}
                  isDragDisabled={isAddingAll}
                >
                  {(provided, snapshot) => (
                    <li
                      key={item.id.toString()}
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="no-select m-2 relative"
                    >
                      {/* The staggered entrance rides on a wrapper because the
                          <li> above carries the drag transform (see
                          transitions.css), and it only plays while the view is
                          opening (see useViewOpening): this column rebuilds on
                          every add, and rows shouldn't re-cascade mid-edit.
                          Add All sends every row across to the ranking, and
                          the countries Clear returns come back in turn (see
                          useBulkMove). A country removed in delete mode
                          comes back with the same entrance. */}
                      <div
                        className={classNames({
                          'view-item-enter-animation': isOpening && !isAddingAll && !hasArrived,
                          'unranked-item-returned-animation': hasArrived || wasReturned,
                          'unranked-item-leaving-animation': isAddingAll,
                        })}
                        style={
                          hasArrived
                            ? staggerStyle(arrival)
                            : isOpening || isAddingAll
                              ? staggerStyle(index)
                              : undefined
                        }
                      >
                        <Card
                          key={item.id.toString()}
                          className="m-auto text-[var(--er-text-tertiary)] bg-'blue' no-select"
                          countryContestant={item}
                          isDragging={snapshot.isDragging}
                          isDropAnimating={snapshot.isDropAnimating}
                          addCallBack={onAddToRanked ? () => onAddToRanked(item) : undefined}
                        />
                      </div>
                      {index === 0 && !welcomeOverlayIsOpen && (
                        <PhantomArrow show={rankedItems.length === 0 && !welcomeOverlayIsOpen} />
                      )}
                    </li>
                  )}
                </Draggable>
              );
            })}
            {/* The drop gap has to open downward without widening the column. The dnd
                library sizes its placeholder from the card being dragged, so a card
                arriving from the other column brings that column's width with it and
                this one stretches for the length of the drag, then snaps back on the
                drop. Clipping keeps the gap's height and takes its width out of the
                column's intrinsic size. A card dragged from this column already set
                its width, so its placeholder keeps that width in place of the card
                while it floats; clipping it too would narrow the column mid-drag
                whenever the widest card is the one moving. */}
            <div
              className={classNames({
                'max-w-0 overflow-hidden': !droppableSnapshot.draggingFromThisWith,
              })}
            >
              {provided.placeholder}
            </div>
          </ul>
        )}
      </StrictModeDroppable>
    </div>
  );
};

export default UnrankedCountriesList;
