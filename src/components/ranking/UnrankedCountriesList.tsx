import { Draggable } from '@hello-pangea/dnd';
import classNames from 'classnames';
import React from 'react';

import { Card } from './Card';
import PhantomArrow from './PhantomArrow';
import { StrictModeDroppable } from './StrictModeDroppable';
import UnrankedEmptyState from './UnrankedEmptyState';
import { CountryContestant } from '../../data/CountryContestant';
import { useAppSelector } from '../../hooks/stateHooks';
import { useArrivals } from '../../hooks/useArrivals';
import { useViewOpening } from '../../hooks/useViewOpening';
import { useWidthMorph } from '../../hooks/useWidthMorph';
import { selectActiveRankedItems } from '../../redux/rankingSelectors';
import { AppState } from '../../redux/store';
import { staggerStyle } from '../../utilities/animationUtil';

interface UnrankedCountriesListProps {
  onAddToRanked?: (item: CountryContestant) => void;
  /** true while every row is leaving for the ranking (see useBulkMove) */
  isAddingAll?: boolean;
  /** whether Add All or Clear is moving the whole ranking (see useBulkMove) */
  isBulkMoving?: () => boolean;
  /** shown once every country is ranked (see UnrankedEmptyState) */
  onShowRanking?: () => void;
  onOpenGlobalSearch?: () => void;
}

const NOT_MOVING = () => false;

/**
 * displays all ranked countries in the left column list on the select view
 */
const UnrankedCountriesList: React.FC<UnrankedCountriesListProps> = ({
  onAddToRanked,
  isAddingAll = false,
  isBulkMoving = NOT_MOVING,
  onShowRanking,
  onOpenGlobalSearch,
}) => {
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const welcomeOverlayIsOpen = useAppSelector((state: AppState) => state.root.welcomeOverlayIsOpen);
  const isOpening = useViewOpening(unrankedItems.length > 0);
  const isMoving = isBulkMoving();
  // Clear's countries come back from the ranking in turn, the rows that were
  // never ranked staying where they are.
  const arrivalOrder = useArrivals(unrankedItems.map((item) => item.id.toString()), isMoving);
  const columnRef = useWidthMorph<HTMLDivElement>(unrankedItems.length, isMoving);
  // an empty column with nothing ranked is still loading its year, not finished
  const isAllRanked = unrankedItems.length === 0 && rankedItems.length > 0;

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
            className={classNames('pt-[0.3em] min-w-[10em] flex-grow tour-step-2', '')}
          >
            {isAllRanked && (
              <UnrankedEmptyState
                isDraggingOver={droppableSnapshot.isDraggingOver}
                onShowRanking={onShowRanking}
                onOpenGlobalSearch={onOpenGlobalSearch}
              />
            )}
            {unrankedItems.map((item, index) => {
              const arrival = arrivalOrder(item.id.toString());
              const hasArrived = !isAddingAll && arrival !== undefined;
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
                          useBulkMove). */}
                      <div
                        className={classNames({
                          'view-item-enter-animation': isOpening && !isAddingAll && !hasArrived,
                          'unranked-item-returned-animation': hasArrived,
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
