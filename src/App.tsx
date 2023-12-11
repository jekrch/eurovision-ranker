import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { countries2023 } from './data/Countries'; // Ensure this data matches the CountryItem type
import { CountryItem } from './data/CountryItem';
import { StrictModeDroppable } from './components/StrictModeDroppable';

const App: React.FC = () => {
  const [unrankedItems, setUnrankedItems] = useState<CountryItem[]>(countries2023);
  const [rankedItems, setRankedItems] = useState<CountryItem[]>([]);


  const handleOnDragEnd = (result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    let activeList, setActiveList, otherList, setOtherList;

    if (source.droppableId === 'unrankedItems') {
      activeList = unrankedItems;
      setActiveList = setUnrankedItems;
      otherList = rankedItems;
      setOtherList = setRankedItems;
    } else {
      activeList = rankedItems;
      setActiveList = setRankedItems;
      otherList = unrankedItems;
      setOtherList = setUnrankedItems;
    }

    const items = Array.from(activeList);
    const [reorderedItem] = items.splice(source.index, 1);

    if (destination.droppableId !== source.droppableId) {
      const destinationItems = Array.from(otherList);
      destinationItems.splice(destination.index, 0, reorderedItem);
      setOtherList(destinationItems);
    } else {
      items.splice(destination.index, 0, reorderedItem);
    }

    setActiveList(items);
  };


  function handleTransitionEnd(provided: any) {
    if (typeof provided.draggableProps.onTransitionEnd === 'function') {
      console.log("test1")
      try {
        queueMicrotask(() => provided.draggableProps.onTransitionEnd?.({
          propertyName: 'transform',
        } as any)
        );
      } catch (ex) {
      }
      console.log("test1")
    }
  }


  return (
    <div className="bg-[#040241] min-h-screen flex no-select">
      <DragDropContext onDragEnd={handleOnDragEnd}>
        {/* Unranked Countries List */}
        <StrictModeDroppable droppableId="unrankedItems">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="w-1/2"
            >
              {unrankedItems.map((item, index) => (
                <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>

                  {(provided) => {
                    //handleTransitionEnd(provided); 
                    return (
                      <li
                        key={item.id.toString()}
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="no-select"
                      >
                        <Card
                          key={item.id.toString()}
                          id={item.id.toString()}
                          className="w-60 m-auto text-slate-400 bg-'blue' no-select"
                          name={item.content}
                        />
                      </li>
                    )
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </StrictModeDroppable>

        {/* Ranked Countries List */}
        <StrictModeDroppable droppableId="rankedItems">
          {(provided) => (
            <ul
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="w-1/2"
            >
              {rankedItems.map((item, index) => (
                <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                  {(provided) => {
                    
                    //handleTransitionEnd(provided);

                    return (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="no-select"
                      >
                        <Card
                          id={item.id.toString()}
                          className="w-60 m-auto text-slate-400 bg-black no-select"
                          name={item.content}
                        />
                      </li>
                    )
                  }}
                </Draggable>
              ))}
              {provided.placeholder}
            </ul>
          )}
        </StrictModeDroppable>
      </DragDropContext>
    </div>
  );
};

export default App;
