import { Draggable } from '@hello-pangea/dnd';
import classNames from 'classnames';
import React from 'react';

import { Card } from './Card';
import PhantomArrow from './PhantomArrow';
import { StrictModeDroppable } from './StrictModeDroppable';
import { CountryContestant } from '../../data/CountryContestant';
import { useAppSelector } from '../../hooks/stateHooks';
import { useViewOpening } from '../../hooks/useViewOpening';
import { selectActiveRankedItems } from '../../redux/rankingSelectors';
import { AppState } from '../../redux/store';
import { staggerStyle } from '../../utilities/animationUtil';

interface UnrankedCountriesListProps {
  onAddToRanked?: (item: CountryContestant) => void;
}

/**
 * displays all ranked countries in the left column list on the select view
 */
const UnrankedCountriesList: React.FC<UnrankedCountriesListProps> = ({ onAddToRanked }) => {
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const welcomeOverlayIsOpen = useAppSelector((state: AppState) => state.root.welcomeOverlayIsOpen);
  const isOpening = useViewOpening(unrankedItems.length > 0);

  return (
    <div className="min-w-[10em] max-w-[40vw] overflow-y-auto overflow-x-hidden flex-grow mr-0 relative">
      <StrictModeDroppable droppableId="unrankedItems" key={`strict-md`}>
        {(provided, droppableSnapshot) => (
          <ul
            key={`ranked-list-${unrankedItems.length}`}
            {...provided.droppableProps}
            ref={provided.innerRef}
            className={classNames('pt-[0.3em] min-w-[10em] tour-step-2', '')}
          >
            {unrankedItems.map((item, index) => (
              <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
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
                        every add, and rows shouldn't re-cascade mid-edit. */}
                    <div
                      className={classNames({ 'view-item-enter-animation': isOpening })}
                      style={isOpening ? staggerStyle(index) : undefined}
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
            ))}
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
