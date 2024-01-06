import React, { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { StrictModeDroppable } from './components/StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import MainModal from './components/MainModal';
import Dropdown from './components/Dropdown';
import { supportedYears } from './data/Contestants';
import NameModal from './components/NameModal';
import { FaGlobe, FaGlobeEurope, FaTv, FaChevronRight } from 'react-icons/fa';
import Navbar from './components/NavBar';
import EditNav from './components/EditNav';
import IntroColumn from './components/IntroColumn';
import { generateYoutubePlaylistUrl, rankedHasAnyYoutubeLinks } from './utilities/YoutubeUtil';
import { AppState } from './redux/types';
import { useDispatch, useSelector } from 'react-redux';
import { setName, setYear, setRankedItems, setUnrankedItems, setShowUnranked, setContestants } from './redux/actions';
import { decodeRankingsFromURL, updateQueryParams } from './utilities/UrlUtil';
import { Dispatch } from 'redux';
import MapModal from './components/MapModal';
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from 'react-joyride';
import { fetchCountryContestantsByYear } from './utilities/ContestantRepository';
import { tourSteps } from './tour/steps';
import ConfigModal from './components/ConfigModal';
import IconButton from './components/IconButton';

const App: React.FC = () => {
  const [mainModalShow, setMainModalShow] = useState(false);
  const [nameModalShow, setNameModalShow] = useState(false);
  const [mapModalShow, setMapModalShow] = useState(false);
  const [configModalShow, setConfigModalShow] = useState(false);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const [modalTab, setModalTab] = useState('about')
  const [configModalTab, setConfigModalTab] = useState('display')
  const dispatch: Dispatch<any> = useDispatch();
  const showUnranked = useSelector((state: AppState) => state.showUnranked);
  const year = useSelector((state: AppState) => state.year);
  const name = useSelector((state: AppState) => state.name);
  const theme = useSelector((state: AppState) => state.theme);
  const rankedItems = useSelector((state: AppState) => state.rankedItems);
  const unrankedItems = useSelector((state: AppState) => state.unrankedItems);
  const isDeleteMode = useSelector((state: AppState) => state.isDeleteMode);

  const [runTour, setRunTour] = useState(false);
  const [joyrideStepIndex, setJoyrideStepIndex] = useState(0);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_BEFORE && index === 0) {
      clearRanking(year);
    }

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any) || (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)) {
      setRunTour(false); // End the tour
      setJoyrideStepIndex(0);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setJoyrideStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  }, []);


  useEffect(() => {
    const setVh = () => {
      let vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };

    window.addEventListener('resize', setVh);

    setVh();

    return () => {
      window.removeEventListener('resize', setVh);
    };
  }, []);


  /**
   * load the url if the user navigates using back/forward. 
   * this should provide and easier undo/redo workflow
   */
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // User clicked back (or forward) button
      const decodeFromUrl = async () => {
        const rankingsExist = await decodeRankingsFromURL(
          dispatch
        );
        // Set showUnranked based on whether rankings exist
        dispatch(
          setShowUnranked(!rankingsExist)
        );
      }
      decodeFromUrl();
    };

    window.addEventListener('popstate', handlePopState);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const executeJoyRideStep = async () => {
      await executeTourStepActions(joyrideStepIndex);
    }
    executeJoyRideStep();
  }, [joyrideStepIndex])

  /**
   * Each case statement corresponds to a step in the tour
   * @param index 
   */
  async function executeTourStepActions(
    index: number
  ) {
    switch (index) {

      case 1:
        if (year !== '2023') {
          dispatch(setYear('2023'));
          setRefreshUrl(Math.random());
        }

        await clearRanking(year);
        dispatch(
          setShowUnranked(true)
        );

        break;

      case 2:
        const specificCountryCodes = ['fi', 'hr', 'es', 'cz', 'no', 'is'];

        // Filter out the specific items based on country codes
        const specificItems = unrankedItems.filter(
          item => specificCountryCodes.includes(item.country.key.toLowerCase())
        );

        // Remove these items from unrankedItems
        const remainingUnrankedItems = unrankedItems.filter(
          item => !specificCountryCodes.includes(item.country.key.toLowerCase())
        );

        // Sort the specific items in the desired order
        const sortedSpecificItems = specificCountryCodes.map(code =>
          specificItems.find(
            item => item.country.key.toLowerCase() === code
          )
        ).filter(item => item !== undefined) as CountryContestant[];

        const newRankedItems = [...sortedSpecificItems, ...rankedItems];

        dispatch(setRankedItems(newRankedItems));
        dispatch(setUnrankedItems(remainingUnrankedItems));
        dispatch(setName("Sigrit's Top Picks"));
        setRefreshUrl(Math.random())

        break;

      case 4:
        dispatch(
          setShowUnranked(false)
        );
        break;

      case 5:
        if (rankedItems.length >= 2) {
          // swap the first two elements
          const temp = rankedItems[0];
          rankedItems[0] = rankedItems[1];
          rankedItems[1] = temp;
        }
        dispatch(
          setRankedItems(rankedItems)
        );
        setRefreshUrl(Math.random());
        break;

      case 8:
        dispatch(
          setShowUnranked(true)
        );
        //openModal('rankings');
        break;

      case 10:
        openConfigModal('rankings');
        break;

      case 11:
        setConfigModalShow(false);
        break;

      case 13:
        setConfigModalShow(false);
        dispatch(setName(""));
        await clearRanking(year);
        dispatch(
          setShowUnranked(true)
        );
        break;
    }
  }

  /**
   * Encode rankings to csv for URL
   * @param rankedCountries 
   * @returns 
   */
  const encodeRankingsToURL = (rankedCountries: CountryContestant[]): string => {
    const ids = rankedCountries.map(item => item.id);
    return ids.join('');
  };

  useEffect(() => {
    const decodeFromUrl = async () => {
      const rankingsExist = await decodeRankingsFromURL(
        dispatch
      );
      // Set showUnranked based on whether rankings exist
      dispatch(
        setShowUnranked(!rankingsExist)
      );
    }
    decodeFromUrl();
  }, [])

  useEffect(() => {
    if (refreshUrl == 0) {
      return;
    }
    updateQueryParams({ r: encodeRankingsToURL(rankedItems) });
    updateQueryParams({ y: year.slice(-2) });
    updateQueryParams({ n: name });
  }, [refreshUrl]);

  useEffect(() => {
    const handleYearUpdate = async () => {
      if (!year?.length) {
        return;
      }
      // if (year.substring(2,4) === params.get('y')) {
      //   console.log('already set');
      //   return;
      // }
      updateQueryParams({ y: year.slice(-2) });
      await decodeRankingsFromURL(
        dispatch
      );
    }
    handleYearUpdate();
  }, [year]);

  // useEffect(() => {
  //   const handleVoteUpdate = async () => {
  //     updateQueryParams({ v: vote });
  //     await decodeRankingsFromURL(
  //       dispatch
  //     );
  //   }
  //   handleVoteUpdate();
  // }, [vote]);

  useEffect(() => {
    updateQueryParams({ n: name });
  }, [name]);

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

    let items = Array.from(activeList);
    const [reorderedItem] = items.splice(source.index, 1);

    // moving between lists
    if (destination.droppableId !== source.droppableId) {
      let destinationItems = Array.from(otherList);
      destinationItems.splice(destination.index, 0, reorderedItem);
      dispatch(
        setOtherList(destinationItems)
      );
    } else {
      items.splice(
        destination.index, 0, reorderedItem
      );
      dispatch(
        setActiveList(items)
      );
    }

    dispatch(setActiveList(items));
    setRefreshUrl(Math.random())
  };

  async function clearRanking(year: string) {

    let yearContestants = await fetchCountryContestantsByYear(year, '', dispatch);

    dispatch(setContestants(yearContestants));
    dispatch(setUnrankedItems(yearContestants));
    dispatch(setRankedItems([]));
    setRefreshUrl(Math.random());
  }

  /**
   * Identify country with the provided Id in the rankedItems array, and 
   * move them back into the unrankedItems array, alphabetically 
   * 
   * @param countryId 
   */
  function deleteRankedCountry(id: string) {
    console.log(rankedItems);
    const index = rankedItems.findIndex(i => i.id === id);
    const [objectToMove] = rankedItems.splice(index, 1);
    const insertionIndex = unrankedItems.findIndex(
      i => i.country.name > objectToMove.country.name
    );
    if (insertionIndex === -1) {
      // If no country is found with a name greater than our object, append it at the end.
      unrankedItems.push(objectToMove);
    } else {
      unrankedItems.splice(insertionIndex, 0, objectToMove); // Insert at the found index
    }

    dispatch(
      setRankedItems(rankedItems)
    );
    dispatch(
      setUnrankedItems(unrankedItems)
    );
    setRefreshUrl(Math.random())
  }

  function openMainModal(tabName: string): void {
    setModalTab(tabName);
    setMainModalShow(true)
  }

  function openConfigModal(tabName: string): void {
    setConfigModalTab(tabName);
    setConfigModalShow(true)
  }

  return (
    <>
      <div className={classNames(
        "site-content flex flex-col h-screen tour-step-12 tour-step-13 tour-step-14",
        { 'star-sky': theme.includes('ab') }
      )}>
        {theme.includes("ab") &&
          <div className="star-container z-10">
            <div className="star" id="stars"></div>
            <div className="star" id="stars2"></div>
            <div className="star" id="stars3"></div>
          </div>
        }
        <Navbar
          openModal={openMainModal}
          openConfigModal={openConfigModal}
        />

        <div className="flex-grow overflow-auto overflow-x-hidden bg-[#040241] flex justify-center bg-opacity-0">
          <DragDropContext
            onDragEnd={handleOnDragEnd}
            key={`drag-drop-context`}
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
                  <StrictModeDroppable droppableId="unrankedItems" key={`strict-md`}>
                    {(provided) => (
                      <ul
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
              <div className="tour-step-5 z-20 min-full">
                <StrictModeDroppable droppableId="rankedItems">
                  {(provided) => (
                    <div
                      className={
                        classNames(
                          "grid h-full max-h-full min-h-full ",
                          { "grid-rows-[1fr_auto]": (rankedItems?.length > 0) }
                        )}
                    >
                      <ul
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={
                          classNames(
                            "overflow-y-auto overflow-x-hidden pt-3 bg-[#1d1b54]",
                            showUnranked ? "max-w-[50vw]" : "w-[80vw] max-w-[30em]",
                            { "auroral-background": theme.includes("ab") }
                          )}
                      >
                        <div className="z-40 w-full text-center font-bold bg-blue-900 text-slate-300 py-1 -mt-3 text-md tracking-tighter">
                          {showUnranked ? (
                            <div className="w-full m-auto flex items-center justify-center">
                              <Dropdown
                                className="tour-step-1  w-[5em]"
                                value={year}
                                onChange={y => { dispatch(setYear(y)); }}
                                options={supportedYears}
                                showSearch={true}
                              />

                            </div>
                          ) : (
                            <div className="mx-2 flex justify-between items-center">
                              {rankedItems?.length > 0 &&
                                <a
                                  onClick={() => setMapModalShow(true)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="display geographical heat map"
                                  className='text-slate-500 hover:text-slate-100 cursor-pointer'
                                >
                                  <FaGlobe className='text-xl tour-step-7' />
                                </a>
                              }
                              <div className="justify-center w-full ml-2">
                                {year}
                                {name?.length > 0 && (
                                  <span className="font-bold text-slate-400 text-md"> - {name}</span>
                                )}
                              </div>
                              {rankedHasAnyYoutubeLinks(rankedItems) && (
                                <a
                                  href={generateYoutubePlaylistUrl(rankedItems)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title="generate youtube playlist"
                                  className='text-slate-500 hover:text-slate-100'
                                >
                                  <FaTv className='text-xl tour-step-6' />
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                        {(rankedItems.length === 0 && showUnranked) && (
                          <IntroColumn
                            openModal={openMainModal}
                            openConfigModal={openConfigModal}
                            setRunTour={setRunTour}
                          />
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
                                    countryContestant={item}
                                    isLargeView={!showUnranked}
                                    isDeleteMode={showUnranked && isDeleteMode}
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
                      {(showUnranked && rankedItems?.length > 0) &&
                        <div className="h-9 bg-blue-900 text-slate-300 items-center flex">
                          <IconButton
                            className={
                              classNames(
                                "tour-step-4 ml-auto bg-blue-500 hover:bg-blue-700 text-white font-normal py-1 pl-[0.7em] pr-[0.9em] rounded-full text-xs mr-0 w-[6em]",
                                { "tada-animation": showUnranked && rankedItems?.length }
                              )}
                            onClick={() => dispatch(setShowUnranked(!showUnranked))}
                            title={'View List'}
                          />
                          <FaChevronRight
                            className={
                              classNames(
                                "ml-2 mr-auto text-lg justify-center align-center bounce-right",
                                { "tada-animation": showUnranked && rankedItems?.length }
                              )}
                          />
                        </div>
                      }
                    </div>
                  )}
                </StrictModeDroppable>
              </div>
            </div>
          </DragDropContext>
        </div>

        {showUnranked &&
          <EditNav
            setNameModalShow={setNameModalShow}
            setRefreshUrl={setRefreshUrl}
          />
        }
      </div>

      <div className="">
        <MainModal
          tab={modalTab}
          isOpen={mainModalShow}
          onClose={() => setMainModalShow(false)}
          startTour={() => {
            dispatch(
              setShowUnranked(true)
            );
            setRunTour(true);
          }}
        />
      </div>
      <NameModal
        isOpen={nameModalShow}
        onClose={() => {
          setNameModalShow(false);
        }}
      />
      <MapModal
        isOpen={mapModalShow}
        onClose={() => { setMapModalShow(false) }}
      />
      <ConfigModal
        tab={configModalTab}
        isOpen={configModalShow}
        onClose={() => setConfigModalShow(false)}
        startTour={() => {
          dispatch(
            setShowUnranked(true)
          );
          setRunTour(true);
        }}
      />
      <Joyride
        disableScrolling={true}
        disableScrollParentFix={true}
        continuous
        run={runTour}
        steps={tourSteps}
        stepIndex={joyrideStepIndex}
        callback={handleJoyrideCallback}
        showProgress={true}
        disableOverlay={false}
        styles={{
          overlay: { height: '100vh' },
          buttonNext: {
            backgroundColor: '#3c82f6'
          },
          buttonBack: {
            color: '#fff',
          },
          options: {
            zIndex: 10000,
            arrowColor: '#333',
            backgroundColor: '#333',
            primaryColor: '#f04',
            textColor: '#fff',
          }
        }}
      />

    </>
  );
};

export default App;