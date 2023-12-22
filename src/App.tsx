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
import { countries } from './data/Countries';

const App: React.FC = () => {
  const [contestants, setContestants] = useState<CountryContestant[]>([]);
  const [unrankedItems, setUnrankedItems] = useState<CountryContestant[]>([]);
  const [rankedItems, setRankedItems] = useState<CountryContestant[]>([]);
  const [showUnranked, setShowUnranked] = useState(false);
  const [configModalShow, setConfigModalShow] = useState(false);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const [refreshDnD, setRefreshDnD] = useState(0);
  const [modalTab, setModalTab] = useState('about')
  const [year, setYear] = useState<string>('');

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

    let contestYear = params.get('y') || '2023';
    if (contestYear !== year) {
      setYear(contestYear);
    }
    
    const yearContestants = fetchCountryContestantsByYear(contestYear);

    if (rankings) {
      const rankedIds = rankings.split('').map(String);
      const rankedCountries = rankedIds
        .map(id => {
            let countryContestant = yearContestants.find(country => country.id === id)
            return countryContestant || new CountryContestant(
              countries.find(c => c.id === id)!
            )
        }).filter(Boolean) as CountryContestant[];

      const unrankedCountries = yearContestants.filter(
        countryContestant => !rankedIds.includes(countryContestant.id)
      );

      setRankedItems(rankedCountries);
      setUnrankedItems(unrankedCountries);

      console.log(rankedCountries)
    } else {
      setUnrankedItems(yearContestants);
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
    updateQueryParams({ y: year });
  }, [rankedItems]);

  useEffect(() => {

    if (!year?.length) {
      return;
    }

    let yearContestants = fetchCountryContestantsByYear(year);

    updateQueryParams({ y: year });
    setContestants(yearContestants);
    setUnrankedItems(yearContestants)
    decodeRankingsFromURL();
  }, [year]);

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

  function openModal(tabName: string): void {
    setModalTab(tabName);
    setConfigModalShow(true)
  }

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
                    onClick={() => openModal('settings')}
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
                        {year}
                      </div>
                      {(rankedItems.length === 0 && showUnranked) && (
                        <div className="flex justify-left items-center">
                          <div className="text-gray-400 font-thin font-mono text-italic text-left ml-7 m-4 text-xs whitespace-normal max-w-[10em] mt-10">
                            <ol className="list-disc">
                              <li className="mb-4">Drag countries to the right to rank</li>
                              <li className="mb-2">Rankings are saved to the URL for you to save or share with friends</li>
                            </ol>
                          </div>
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
                                  contestant={item.contestant!}
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
          tab={modalTab}
          isOpen={configModalShow} 
          setYear={setYear}
          year={year}
          onClose={() => setConfigModalShow(false)}
        />
    </>
  );
};

export default App;
