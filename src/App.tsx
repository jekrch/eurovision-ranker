import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { countries2023 } from './data/Countries';
import { CountryItem } from './data/CountryItem';
import { StrictModeDroppable } from './components/StrictModeDroppable';

const App: React.FC = () => {
  const [unrankedItems, setUnrankedItems] = useState<CountryItem[]>(countries2023);
  const [rankedItems, setRankedItems] = useState<CountryItem[]>([]);
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setIsChecked(event.target.checked);
  };
  
  /**
   * Encode rankings to csv for URL
   * @param rankedCountries 
   * @returns 
   */
  const encodeRankingsToURL = (rankedCountries: CountryItem[]): string => {
    const ids = rankedCountries.map(item => item.id);
    return ids.join(',');
  };

  /**
   * Decode rankings from URL 
   */
  const decodeRankingsFromURL = (): void => {
    const params = new URLSearchParams(window.location.search);
    const rankings = params.get('rankings');
    if (rankings) {
      const rankedIds = rankings.split(',').map(String);

      const rankedCountries = rankedIds
        .map(id => countries2023.find(country => country.id === id))
        .filter(Boolean) as CountryItem[];

      const unrankedCountries = countries2023.filter(
        country => !rankedIds.includes(country.id)
      );

      setRankedItems(rankedCountries);
      setUnrankedItems(unrankedCountries);
    } else {
      setUnrankedItems(countries2023);
    }
  };

  useEffect(() => {
    decodeRankingsFromURL();
  }, []);

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

    // moving between lists
    if (destination.droppableId !== source.droppableId) {
      const destinationItems = Array.from(otherList);
      destinationItems.splice(destination.index, 0, reorderedItem);
      setOtherList(destinationItems);
      window.history.pushState(null, '', `?rankings=${encodeRankingsToURL(rankedItems)}`);

    } else {
      items.splice(destination.index, 0, reorderedItem);
      setActiveList(items);
      window.history.pushState(null, '', `?rankings=${encodeRankingsToURL(rankedItems)}`);
    }

    setActiveList(items);
  };

  return (
    <>
    <div className="flex flex-col min-h-screen">
      <nav className="bg-gray-800 text-white p-4 sticky top-0 z-50">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-lg font-semibold">Eurovision Rankr
          </div>
          <ul className="flex space-x-4">
            <li><div className="flex items-center">
          <input 
            type="checkbox" 
            id="navbarCheckbox" 
            checked={isChecked} 
            onChange={handleCheckboxChange} 
            className="form-checkbox h-4 w-4 text-blue-600"
          />
          <label htmlFor="navbarCheckbox" className="ml-2 text-xs">
            show unranked
          </label>
        </div></li>
          </ul>
        </div>
      </nav>

      <div className="bg-[#040241] flex-grow flex no-select">
        <DragDropContext onDragEnd={handleOnDragEnd}>
        <div className="flex flex-1">
          {/* Unranked Countries List */}
          <StrictModeDroppable droppableId="unrankedItems">
            {(provided) => (
              <ul
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="w-1/2 overflow-auto pt-3"
                style={{ maxHeight: `calc(100vh - 4rem)` }}
              >
                {unrankedItems.map((item, index) => (
                  <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>

                    {(provided) => {
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
                            className="w-40 m-auto text-slate-400 bg-'blue' no-select"
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
                className="w-2/3 overflow-auto pt-3"
                style={{ maxHeight: `calc(100vh - 6rem)` }}
              >
                {rankedItems.map((item, index) => (
                  <Draggable key={item.id.toString()} draggableId={item.id.toString()} index={index}>
                    {(provided) => {
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
                            rank={index + 1}
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
          </div>
        </DragDropContext>
      </div>
      </div>
    </>
  );
};

export default App;
