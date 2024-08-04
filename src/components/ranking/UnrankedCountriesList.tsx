import React from 'react';
import { StrictModeDroppable } from './StrictModeDroppable';
import classNames from 'classnames';
import { Card } from './Card';
import { AppState } from '../../redux/store';
import { useAppSelector } from '../../utilities/hooks';
import { Draggable } from '@hello-pangea/dnd';

/**
 * Displays all ranked countries in the left column list on the select view
 * @param 
 * @returns 
 */
const UnrankedCountriesList: React.FC = ({
}) => {

    const unrankedItems = useAppSelector((state: AppState) => state.unrankedItems);

    return (
        <div className="min-w-[10em] max-w-[40vw] overflow-y-auto overflow-x-hidden flex-grow mr-0">
            <StrictModeDroppable droppableId="unrankedItems" key={`strict-md`}>
                {(provided) => (
                    <ul
                        key={`ranked-list-${unrankedItems.length}`}
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={classNames("pt-3 min-w-[10em] tour-step-2", "")}
                    >
                        {unrankedItems.map((item, index) => (
                            <Draggable
                                key={item.id.toString()}
                                draggableId={item.id.toString()}
                                index={index}
                            >
                                {(provided, snapshot) => {
                                    return (
                                        <li
                                            key={item.id.toString()}
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="no-select m-2"
                                        >
                                            <Card
                                                key={item.id.toString()}
                                                className="m-auto text-slate-400 bg-'blue' no-select"
                                                countryContestant={item}
                                                isDragging={snapshot.isDragging}
                                            />
                                        </li>
                                    );
                                }}
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