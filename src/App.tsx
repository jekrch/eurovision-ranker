import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { countries2023 } from './data/Countries';
import { CountryItem } from './data/CountryItem';
import { StrictModeDroppable } from './components/StrictModeDroppable';
import classNames from 'classnames';

const App: React.FC = () => {
  const [unrankedItems, setUnrankedItems] = useState<CountryItem[]>(countries2023);
  const [rankedItems, setRankedItems] = useState<CountryItem[]>([]);
  const [showUnranked, setShowUnranked] = useState(false);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const [refreshDnD, setRefreshDnD] = useState(0);

  const handleCheckboxChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShowUnranked(event.target.checked);
  };

  /**
   * Encode rankings to csv for URL
   * @param rankedCountries 
   * @returns 
   */
  const encodeRankingsToURL = (rankedCountries: CountryItem[]): string => {
    const ids = rankedCountries.map(item => item.id);
    return ids.join('');
  };

  /**
   * Decode rankings from URL 
   */
  const decodeRankingsFromURL = (): number | undefined => {
    const params = new URLSearchParams(window.location.search);
    const rankings = params.get('r');

    if (rankings) {

      const rankedIds = rankings.split('').map(String);
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

    return rankings?.length
  };

  useEffect(() => {
    const rankingsExist = decodeRankingsFromURL();
  
    // Set showUnranked based on whether rankings exist
    setShowUnranked(!rankingsExist);
  }, [])

  useEffect(() => {
    window.history.pushState(null, '', `?r=${encodeRankingsToURL(rankedItems)}`);
  }, [rankedItems]);

  useEffect(() => {
    setRefreshDnD(Math.random());
  }, [showUnranked]);

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
    } else {
      items.splice(destination.index, 0, reorderedItem);
      setActiveList(items);
    }

    setActiveList(items);
    setRefreshUrl(Math.random())
  };

  return (
    <>
      <div className="flex flex-col h-screen">
        <nav className="bg-gray-800 text-white p-4 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-xl tracking-wider gradient-text flex items-center">
              Eurovision Ranker
              <img
                src={`${process.env.PUBLIC_URL}/eurovision-heart.svg`}
                alt="Heart"
                className="w-4 h-4 ml-2" />
            </div>
            <ul className="flex space-x-4">
              <li><div className="flex items-center">
                <input
                  type="checkbox"
                  id="navbarCheckbox"
                  checked={showUnranked}
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

        <div className="flex-grow overflow-auto overflow-x-hidden bg-[#040241] flex justify-center pixelated-background">
          <DragDropContext
            onDragEnd={handleOnDragEnd}
            key={`drag-drop-context-${refreshDnD}`}
            onDragStart={() => {
              if (window.navigator.vibrate) {
                window.navigator.vibrate(100);
              }
            }}
          >

            <div className="flex flex-row justify-center gap-4 p-4">
              {/* Unranked Countries List */}
              {showUnranked && (
                <div className="max-w-[50vw] overflow-y-auto flex-grow mr-1" >
                  <StrictModeDroppable droppableId="unrankedItems" key={`strict-${refreshDnD}`}>
                    {(provided) => (
                      <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={classNames("pt-3 min-w-[10em]", "")}
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
                                    country={item}
                                    isDragging={snapshot.isDragging}
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
              )}
              {/* Ranked Countries List */}
              <div>
                <StrictModeDroppable droppableId="rankedItems">
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={classNames("h-full min-w-[10em] overflow-y-auto overflow-x-hidden pt-3 bg-[#1d1b54]", showUnranked ? "max-w-[50vw]" : "w-[80vw] max-w-[30em]")}
                    >
                      {rankedItems.map((item, index) => (
                        <Draggable key={`draggable-${item.id.toString()}`} draggableId={item.id.toString()} index={index}>
                          {(provided, snapshot) => {
                            return (
                              <li
                                key={`li-${item.id.toString()}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className="no-select m-2"
                              >
                                <Card
                                  key={`card-${item.id.toString()}`}
                                  className="m-auto text-slate-400 bg- bg-[#03022d] no-select"
                                  rank={index + 1}
                                  country={item}
                                  isLargeView={!showUnranked}
                                  isDragging={snapshot.isDragging}
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
            </div>
          </DragDropContext>
        </div>
      </div>
    </>
  );
};

export default App;
