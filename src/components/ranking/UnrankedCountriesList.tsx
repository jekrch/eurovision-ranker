import { Draggable } from '@hello-pangea/dnd';
import classNames from 'classnames';
import React from 'react';

import { Card } from './Card';
import PhantomArrow from './PhantomArrow';
import { StrictModeDroppable } from './StrictModeDroppable';
import { CountryContestant } from '../../data/CountryContestant';
import { useAppSelector } from '../../hooks/stateHooks';
import { AppState } from '../../redux/store';

interface UnrankedCountriesListProps {
  onAddToRanked?: (item: CountryContestant) => void;
}

/**
 * displays all ranked countries in the left column list on the select view
 */
const UnrankedCountriesList: React.FC<UnrankedCountriesListProps> = ({ onAddToRanked }) => {
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const rankedItems = useAppSelector((state: AppState) => state.root.rankedItems);
  const welcomeOverlayIsOpen = useAppSelector((state: AppState) => state.root.welcomeOverlayIsOpen);

  return (
    <div className="min-w-[10em] max-w-[40vw] overflow-y-auto overflow-x-hidden flex-grow mr-0 relative">
      <StrictModeDroppable droppableId="unrankedItems" key={`strict-md`}>
        {(provided) => (
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
                    <Card
                      key={item.id.toString()}
                      className="m-auto text-[var(--er-text-tertiary)] bg-'blue' no-select"
                      countryContestant={item}
                      isDragging={snapshot.isDragging}
                      addCallBack={onAddToRanked ? () => onAddToRanked(item) : undefined}
                    />
                    {index === 0 && !welcomeOverlayIsOpen && (
                      <PhantomArrow show={rankedItems.length === 0 && !welcomeOverlayIsOpen} />
                    )}
                  </li>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </ul>
        )}
      </StrictModeDroppable>
    </div>
  );
};

export default UnrankedCountriesList;
