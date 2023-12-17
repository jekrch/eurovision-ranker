import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { StrictModeDroppable } from './components/StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import { fetchCountryContestantsByYear } from './utilities/ContestantFactory';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog } from '@fortawesome/free-solid-svg-icons';
import ConfigModal from './components/ConfigModal';

const App: React.FC = () => {
  const [contestants, setContestants] = useState<CountryContestant[]>(fetchCountryContestantsByYear('2023'));
  const [unrankedItems, setUnrankedItems] = useState<CountryContestant[]>(contestants);
  const [rankedItems, setRankedItems] = useState<CountryContestant[]>([]);
  const [showUnranked, setShowUnranked] = useState(false);
  const [configModalShow, setConfigModalShow] = useState(false);
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
  const encodeRankingsToURL = (rankedCountries: CountryContestant[]): string => {
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
        .map(id => contestants.find(country => country.id === id))
        .filter(Boolean) as CountryContestant[];

        console.log(rankedIds)
        console.log(contestants)
      const unrankedCountries = contestants.filter(
        countryContestant => !rankedIds.includes(countryContestant.id)
      );
      console.log(unrankedCountries)
      setRankedItems(rankedCountries);
      setUnrankedItems(unrankedCountries);
    } else {
      setUnrankedItems(contestants);
    }

    return rankings?.length
  };

  useEffect(() => {
    const rankingsExist = decodeRankingsFromURL();

    // Set showUnranked based on whether rankings exist
    setShowUnranked(!rankingsExist);
  }, [])

  useEffect(() => {
    //window.history.pushState(null, '', `?r=${encodeRankingsToURL(rankedItems)}`);
    updateQueryParams({ r: encodeRankingsToURL(rankedItems) });
    updateQueryParams({ y: '23' });
  }, [rankedItems]);

  useEffect(() => {
    setRefreshDnD(Math.random());
  }, [showUnranked]);

  /**
   * Function to update the query parameters
   */
  function updateQueryParams(params: { [key: string]: string }) {
    const searchParams = new URLSearchParams(window.location.search);

    // Set new or update existing parameters
    Object.keys(params).forEach(key => {
      searchParams.set(key, params[key]);
    });

    // Update the URL without reloading the page
    window.history.pushState(null, '', '?' + searchParams.toString());
  }

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
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white p-4 sticky top-0 z-100">
          <div className="container mx-auto flex justify-between items-center">
            <div className="text-lg tracking-tighter gradient-text font-bold flex items-center">
              Eurovision Ranker
              <img
                src={`${process.env.PUBLIC_URL}/eurovision-heart.svg`}
                alt="Heart"
                className="w-4 h-4 ml-2" />
            </div>
            <ul className="flex space-x-2">
              <li>
                <div className="flex items-center">
                  <button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-normal py-1 px-3 rounded-full text-xs mr-0 w-[5em]"
                    onClick={() => { setShowUnranked(!showUnranked) }}
                  >
                    {showUnranked ? 'details' : `select`}
                  </button>
                  <FontAwesomeIcon
                    className="configCog mr-1 ml-4 text-xl"
                    icon={faCog}
                    onClick={() => setConfigModalShow(true)}
                  />
                </div>
              </li>
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
                                    country={item.country}
                                    contestant={item.contestant}
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
                      <div className="w-full text-center font-bold bg-blue-900 text-slate-300 py-1 -mt-3 text-md tracking-tighter">
                        2023
                      </div>
                      {rankedItems.length === 0 && (
                        <div className="flex justify-center items-center h-full">
                          <span className="text-gray-400 font-thin font-mono text-italic text-center m-4 text-xs whitespace-normal max-w-[10em]">Drag over a country to rank</span>
                        </div>
                      )}
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
                                  country={item.country}
                                  contestant={item.contestant}
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
      <ConfigModal 
          isOpen={configModalShow} 
          onClose={() => setConfigModalShow(false)}
        />
    </>
  );
};

export default App;
