import React, { SetStateAction, useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { StrictModeDroppable } from './components/StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import MainModal from './components/MainModal';
import Dropdown from './components/Dropdown';
import { supportedYears } from './data/Contestants';
import NameModal from './components/NameModal';
import { FaGlobe, FaGlobeEurope, FaTv } from 'react-icons/fa';
import Navbar from './components/NavBar';
import EditNav from './components/EditNav';
import IntroColumn from './components/IntroColumn';
import { generateYoutubePlaylistUrl, rankedHasAnyYoutubeLinks } from './utilities/YoutubeUtil';
import { AppState } from './redux/types';
import { useDispatch, useSelector } from 'react-redux';
import { setName, setYear, setRankedItems, setUnrankedItems, setShowUnranked, setContestants } from './redux/actions';
import { decodeRankingsFromURL } from './utilities/UrlUtil';
import { Dispatch } from 'redux';
import MapModal from './components/MapModal';
import Joyride, { ACTIONS, CallBackProps, EVENTS, STATUS } from 'react-joyride';
import { fetchCountryContestantsByYear } from './utilities/ContestantRepository';
import { tourSteps } from './tour/steps';

const App: React.FC = () => {
  const [mainModalShow, setMainModalShow] = useState(false);
  const [nameModalShow, setNameModalShow] = useState(false);
  const [mapModalShow, setMapModalShow] = useState(false);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const [refreshDnD, setRefreshDnD] = useState(0);
  const [modalTab, setModalTab] = useState('about')
  const dispatch: Dispatch<any> = useDispatch();
  const {
    year, name, theme, rankedItems, unrankedItems, showUnranked, isDeleteMode
  } = useSelector((state: AppState) => state);


  const [runTour, setRunTour] = useState(false);
  const [joyrideStepIndex, setJoyrideStepIndex] = useState(0);

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { action, index, status, type } = data;

    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status as any) || (action === ACTIONS.CLOSE && type === EVENTS.STEP_AFTER)) {
      setRunTour(false); // End the tour
      setJoyrideStepIndex(0);
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setJoyrideStepIndex(index + (action === ACTIONS.PREV ? -1 : 1));
    }
  }, []);


  useEffect(() => {
    const decodeFromUrl = async () => {
      await executeTourStepActions(joyrideStepIndex);
    }
    decodeFromUrl();
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

      case 8:
        dispatch(
          setShowUnranked(true)
        ); 
        //openModal('rankings');
        break;   
      
      case 10:
        openModal('rankings');
        break;

      case 13:
        setMainModalShow(false);
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

  useEffect(() => {
    updateQueryParams({ n: name });
  }, [name]);

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
  function deleteRankedCountry(countryId: string) {
    const index = rankedItems.findIndex(i => i.id === countryId);
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

  function openModal(tabName: string): void {
    setModalTab(tabName);
    setMainModalShow(true)
  }

  return (
    <>
      <div className="site-content flex flex-col h-screen tour-step-12 tour-step-13 tour-step-14">
        <Navbar
          openModal={openModal}
        />
        <div className="flex-grow overflow-auto overflow-x-hidden bg-[#040241] flex justify-center bg-opacity-0">
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
              <div className="tour-step-5">
                <StrictModeDroppable droppableId="rankedItems">
                  {(provided) => (
                    <ul
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className={classNames("h-full min-w-[10em] overflow-y-auto overflow-x-hidden pt-3 bg-[#1d1b54]", showUnranked ? "max-w-[50vw]" : "w-[80vw] max-w-[30em]", theme.includes("ab") ? "auroral-background" : null)}
                    >
                      <div className="z-40 w-full text-center font-bold bg-blue-900 text-slate-300 py-1 -mt-3 text-md tracking-tighter">
                        {showUnranked ? (
                          <div className="w-full m-auto flex">
                            <Dropdown
                              className="tour-step-1 mx-auto relative w-[5em]"
                              value={year}
                              onChange={y => { dispatch(setYear(y)); }}
                              options={supportedYears}
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
                          openModal={openModal}
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
      <div className="tour-step-11">
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
            // ...other style adjustments based on theme
          }
        }}
      />

    </>
  );
};

export default App;