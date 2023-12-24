import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { StrictModeDroppable } from './components/StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import { fetchCountryContestantsByYear } from './utilities/ContestantFactory';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenSquare, faHouseUser, faCog, faArrowRight, faTrashAlt, faTrashRestoreAlt, faCheckSquare, faSquare, faHeart, faList, faPenAlt } from '@fortawesome/free-solid-svg-icons';
import MainModal from './components/MainModal';
import { countries } from './data/Countries';
import Dropdown from './components/Dropdown';
import { supportedYears } from './data/Contestants';
import { Country } from './data/Country';
import NameModal from './components/NameModal';
import { isMobile } from 'react-device-detect';
import { FaTv } from 'react-icons/fa';

const App: React.FC = () => {
  const [contestants, setContestants] = useState<CountryContestant[]>([]);
  const [unrankedItems, setUnrankedItems] = useState<CountryContestant[]>([]);
  const [rankedItems, setRankedItems] = useState<CountryContestant[]>([]);
  const [showUnranked, setShowUnranked] = useState(false);
  const [mainModalShow, setMainModalShow] = useState(false);
  const [nameModalShow, setNameModalShow] = useState(false);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const [refreshDnD, setRefreshDnD] = useState(0);
  const [modalTab, setModalTab] = useState('about')
  const [year, setYear] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [deleteMode, setDeleteMode] = useState(false);

  /**
   * Encode rankings to csv for URL
   * @param rankedCountries 
   * @returns 
   */
  const encodeRankingsToURL = (rankedCountries: CountryContestant[]): string => {
    const ids = rankedCountries.map(item => item.country.key);
    return ids.join('');
  };

  /**
   * Decode rankings from URL 
   */
  const decodeRankingsFromURL = (): number | undefined => {
    const params = new URLSearchParams(window.location.search);

    const rankingName = params.get('n');

    if (rankingName && name !== rankingName) {
      setName(rankingName);
    }

    let contestYear = getYearFromUrl(params);

    if (contestYear !== year) {
      setYear(contestYear);
    }

    const yearContestants = fetchCountryContestantsByYear(contestYear);

    const rankings = params.get('r');

    if (rankings) {
      let rankedIds: string[] = convertRankingsStrToArray(rankings);

      const rankedCountries = rankedIds
        .map(id => {
          let countryContestant = yearContestants.find(country => country.country.key === id)

          if (countryContestant) {
            return countryContestant;
          } else {
            const country = countries.find(c => c.key === id);
            if (country) {
              return new CountryContestant(country);
            } else {
              return;
            }
          }
        }).filter(Boolean) as CountryContestant[];

      const unrankedCountries = yearContestants.filter(
        countryContestant => !rankedIds.includes(countryContestant.id)
      );

      setRankedItems(rankedCountries);
      setUnrankedItems(unrankedCountries);

    } else {
      setUnrankedItems(yearContestants);
    }
    return rankings?.length
  };

  function rankedHasAnyYoutubeLinks(){
    return rankedItems.some(item => item?.contestant?.youtube?.length);
  }

  function generateYoutubePlaylistUrl() {

    const baseYouTubeURL = "https://www.youtube.com/watch_videos?video_ids=";
    const videoIds = rankedItems.map(item => {
        if (!item?.contestant?.youtube?.length) {
          return;
        }
        let youtubeURL: URL = new URL(item?.contestant?.youtube);
        const urlParams = new URLSearchParams(
          youtubeURL.search
        );
        return urlParams.get('v');
    }).filter(
      id => id?.length
    ).join(',');

    return baseYouTubeURL + videoIds;
};

  function convertRankingsStrToArray(rankings: string) {
    let rankedIds: string[] = [];
  
    for (let i = 0; i < rankings.length; i += 2) {
      rankedIds.push(rankings.substring(i, i + 2));
    }
  
    // remove duplicates 
    let uniqueSet = new Set(rankedIds);
    rankedIds = Array.from(uniqueSet);
    return rankedIds;
  }

  /**
   * Extract the year from the url y param
   * 
   * @param params 
   * @returns 
   */
  function getYearFromUrl(params: URLSearchParams) {
    let contestYear = '20' + (params.get('y') || '23');
  
    if (!supportedYears.includes(contestYear)) {
      contestYear = '2023';
    }
    return contestYear;
  }

  useEffect(() => {
    const rankingsExist = decodeRankingsFromURL();
    // Set showUnranked based on whether rankings exist
    setShowUnranked(!rankingsExist);
  }, [])

  useEffect(() => {
    //window.history.pushState(null, '', `?r=${encodeRankingsToURL(rankedItems)}`);
    updateQueryParams({ r: encodeRankingsToURL(rankedItems) });
    updateQueryParams({ y: year.slice(-2) });
  }, [rankedItems]);


  useEffect(() => {

    if (!year?.length) {
      return;
    }
    let yearContestants = fetchCountryContestantsByYear(year);

    updateQueryParams({ y: year.slice(-2) });
    setContestants(yearContestants);
    setUnrankedItems(yearContestants)
    decodeRankingsFromURL();
  }, [year]);

  useEffect(() => {
    updateQueryParams({ n: name });
  }, [name]);

  /**
   * Clear rankedItems and fill unrankedItems with the relevant year's contestants
   */
  function resetRanking() {
    let yearContestants = fetchCountryContestantsByYear(year);

    setContestants(yearContestants);
    setUnrankedItems(yearContestants)
    setRankedItems([])
  }

  /**
   * Add all remaining unranked items to the ranked array
   */
  function addAllUnranked() {
    setUnrankedItems([])
    setRankedItems(rankedItems.concat(unrankedItems));
  }

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

  /**
   * Handler for the drop event. Either reposition an item within 
   * its source array or move it to the other array 
   * 
   * @param result 
   * @returns 
   */
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

  /**
   * Identify country with the provided Id in the rankedItems array, and 
   * move them back into the unrankedItems array, alphabetically 
   * 
   * @param countryId 
   */
  function deleteRankedCountry(countryId: string) {

    const index = rankedItems.findIndex(obj => obj.country.key === countryId);
    const [objectToMove] = rankedItems.splice(index, 1);

    const insertionIndex = unrankedItems.findIndex(obj => obj.country.name > objectToMove.country.name);
    if (insertionIndex === -1) {
      unrankedItems.push(objectToMove); // If no country is found with a name greater than our object, append it at the end.
    } else {
      unrankedItems.splice(insertionIndex, 0, objectToMove); // Insert at the found index
    }

    setRankedItems(rankedItems);
    setUnrankedItems(unrankedItems);
    setRefreshUrl(Math.random())
  }

  function openModal(tabName: string): void {
    setModalTab(tabName);
    setMainModalShow(true)
  }

  return (
    <>
      <div className="flex flex-col h-screen">
        <nav className="nav-diagonal-split-bg bg-gray-800 text-white p-2 px-4 sticky top-0 z-50">
          <div className="container mx-auto flex justify-between items-center z-50">
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
                    className="houseUser mr-1 mb-1 ml-4 text-xl"
                    icon={faHouseUser}
                    onClick={() => openModal('about')}
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
                      <div className="z-40 w-full text-center font-bold bg-blue-900 text-slate-300 py-1 -mt-3 text-md tracking-tighter">
                        {showUnranked ? (
                          <div className="w-full m-auto flex">
                            <Dropdown
                              className="mx-auto relative w-[5em]"
                              value={year}
                              onChange={setYear}
                              options={supportedYears}
                            />
                          </div>
                        ) : (
                          <div className="mx-2 flex justify-between items-center">
  <div className="justify-center w-full ml-2">
    {year}
    {name?.length > 0 && (
      <span className="font-bold text-slate-400 text-md"> - {name}</span>
    )}
  </div>
  {rankedHasAnyYoutubeLinks() && (
    <a
      href={generateYoutubePlaylistUrl()} 
      target="_blank" 
      rel="noopener noreferrer" 
      title="generate youtube playlist"
      className='text-slate-500 hover:text-slate-100'
    >
      <FaTv className='text-xl' />
    </a>
  )}
</div>
                        )}
                      </div>
                      {(rankedItems.length === 0 && showUnranked) && (
                        <div className="flex justify-left items-center">
                          <div className="text-gray-400 font-thin font-mono text-italic text-left ml-7 m-4 text-xs whitespace-normal max-w-[10em] mt-6">
                            <ol className="list-disc mb-7">
                              <li className="mb-3">Drag countries into this column to rank</li>
                              <li className="mb-3">Rankings are saved to the URL for you to save or share with friends</li>
                              <li className="mb-2">Click 'details' above to see more info on your ranked countries</li>
                            </ol>

                            <div className="">
                              <div
                                className={'flex items-center houseUser mb-7'}
                                onClick={() => openModal('about')}
                              >
                                <FontAwesomeIcon
                                  className="mr-2 ml-0 text-xl"
                                  icon={faHouseUser}

                                />
                                <span className="ml-[0.2em] mt-[0.2em] font-bold">About</span>
                              </div>

                              <div
                                className={'houseUser flex items-center mb-7'}
                                onClick={() => openModal('donate')}
                              >
                                <FontAwesomeIcon
                                  className="mr-2 ml-0 text-xl"
                                  icon={faHeart}

                                />
                                <span className="ml-[0.2em] mt-[0.2em] font-bold">Donate</span>
                              </div>

                              <div
                                className={'houseUser flex items-center'}
                                onClick={() => openModal('rankings')}
                              >
                                <FontAwesomeIcon
                                  className="mr-2 ml-0 text-xl"
                                  icon={faList}

                                />
                                <span className="ml-[0.2em] mt-[0.2em] font-bold">Rankings</span>
                              </div>

                            </div>
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
                                  isDeleteMode={showUnranked && deleteMode}
                                  deleteCallBack={deleteRankedCountry}
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

        {showUnranked &&
          <nav className="nav-diagonal-split-bg bg-gray-800 text-white p-3 sticky bottom-0 z-50">
            <div className="container mx-auto flex justify-between items-center z-50">
              <ul className="flex space-x-2">
                <li>
                  <div className="flex items-center">
                    <button
                      disabled={!unrankedItems?.length}
                      className={classNames(
                        "ml-0 text-white font-normal py-1 px-3 rounded-full text-xs mr-0",
                        unrankedItems?.length ? "bg-blue-500 hover:bg-blue-700" : "bg-slate-500"
                      )}
                      onClick={() => { addAllUnranked() }}
                    >
                      <FontAwesomeIcon
                        className="mr-2 ml-0 text-xs"
                        icon={faArrowRight}
                      />
                      add all
                    </button>

                    <button
                      disabled={!rankedItems?.length}
                      className={classNames(
                        "ml-4 text-white font-normal py-1 px-3 rounded-full text-xs mr-0",
                        rankedItems?.length ? "bg-blue-500 hover:bg-blue-700" : "bg-slate-500"
                      )}
                      onClick={() => { resetRanking() }}
                    >

                      <FontAwesomeIcon
                        className="mr-1 ml-0 text-xs"
                        icon={faTrashAlt}
                      /> clear
                    </button>

                    <button
                      disabled={!rankedItems?.length}
                      className={classNames(
                        "ml-4 text-white font-normal py-1 px-3 rounded-full text-xs mr-0",
                        rankedItems?.length ? "bg-blue-500 hover:bg-blue-700" : "bg-slate-500",
                        rankedItems?.length && deleteMode ? "bg-red-800 border-red-100 hover:bg-red-700" : null
                      )}
                      onClick={() => { setDeleteMode(!deleteMode) }}
                    >
                      <FontAwesomeIcon
                        className="mr-1 ml-0 text-xs"
                        icon={rankedItems?.length && deleteMode ? faCheckSquare : faSquare}
                      /> delete
                    </button>

                    <button
                      className={classNames(
                        "ml-4 text-white font-normal py-1 px-3 rounded-full text-xs mr-0",
                        "bg-blue-500 hover:bg-blue-700"
                      )}
                      onClick={() => { setNameModalShow(true) }}
                    >
                      <FontAwesomeIcon
                        className="mr-2 ml-0 text-xs"
                        icon={faPenAlt}
                      />
                      name
                    </button>
                  </div>
                </li>
              </ul>
            </div>
          </nav>
        }
      </div>
      <MainModal
        tab={modalTab}
        isOpen={mainModalShow}
        setYear={setYear}
        year={year}
        onClose={() => setMainModalShow(false)}
      />
      <NameModal
        isOpen={nameModalShow}
        setName={setName}
        name={name}
        onClose={() => {
          setNameModalShow(false);
        }}
      />
    </>
  );
};

export default App;

