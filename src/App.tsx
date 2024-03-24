import React, { useEffect, useState } from 'react';
import { DragDropContext, Draggable, DropResult } from 'react-beautiful-dnd';
import { Card } from './components/Card';
import { StrictModeDroppable } from './components/StrictModeDroppable';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import MainModal from './components/MainModal';
import { supportedYears } from './data/Contestants';
import NameModal from './components/NameModal';
import { FaChevronRight } from 'react-icons/fa';
import Navbar from './components/NavBar';
import EditNav from './components/EditNav';
import IntroColumn from './components/IntroColumn';
import { generateYoutubePlaylistUrl } from './utilities/YoutubeUtil';
import { AppState } from './redux/types';
import { useDispatch, useSelector } from 'react-redux';
import { setRankedItems, setUnrankedItems, setShowUnranked, setActiveCategory, setShowTotalRank } from './redux/actions';
import { decodeRankingsFromURL, updateQueryParams, urlHasRankings } from './utilities/UrlUtil';
import { Dispatch } from 'redux';
import MapModal from './components/MapModal';
import ConfigModal from './components/ConfigModal';
import IconButton from './components/IconButton';
import RankedItemsHeader from './components/RankedItemsHeader';
import WelcomeOverlay from './components/WelcomeOverlay';
import { DetailsCard } from './components/DetailsCard';
import SongModal from './components/LyricsModal';
import { Toaster } from 'react-hot-toast';
import { toastOptions } from './utilities/ToasterUtil';
import { areCategoriesSet, categoryRankingsExist, removeCountryFromUrlCategoryRankings, reorderByAllWeightedRankings } from './utilities/CategoryUtil';
import { isArrayEqual } from './utilities/RankAnalyzer';
import JoyrideTour from './tour/JoyrideTour';

const App: React.FC = () => {
  const [mainModalShow, setMainModalShow] = useState(false);
  const [nameModalShow, setNameModalShow] = useState(false);
  const [mapModalShow, setMapModalShow] = useState(false);
  const [configModalShow, setConfigModalShow] = useState(false);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const [refreshRankedList, setRefreshRankedList] = useState(0);
  const [modalTab, setModalTab] = useState('about')
  const [configModalTab, setConfigModalTab] = useState('display')
  const dispatch: Dispatch<any> = useDispatch();
  const showUnranked = useSelector((state: AppState) => state.showUnranked);
  const year = useSelector((state: AppState) => state.year);
  const name = useSelector((state: AppState) => state.name);
  const theme = useSelector((state: AppState) => state.theme);
  const categories = useSelector((state: AppState) => state.categories);
  const activeCategory = useSelector((state: AppState) => state.activeCategory);
  const showTotalRank = useSelector((state: AppState) => state.showTotalRank);
  const vote = useSelector((state: AppState) => state.vote);
  const rankedItems = useSelector((state: AppState) => state.rankedItems);
  const unrankedItems = useSelector((state: AppState) => state.unrankedItems);
  const isDeleteMode = useSelector((state: AppState) => state.isDeleteMode);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [selectedCountryContestant, setSelectedCountryContestant] = useState<CountryContestant | undefined>(undefined);
  /**
   * used to synchronize the horizontal scrollbar on detail cards across all ranked items
   */
  const [categoryScrollPosition, setCategoryScrollPosition] = useState(0);
  const [showOverlay, setShowOverlay] = useState(!areRankingsSet());
  const [isOverlayExit, setIsOverlayExit] = useState(false);
  const [runTour, setRunTour] = useState(false);

  /**
   * Determines whether any rankings are set in the url
   * @returns 
   */
  function areRankingsSet() {
    const urlParams = new URLSearchParams(window.location.search);
    const rParam = urlParams.get('r');

    if (rParam !== null && rParam !== '') {
      return true;
    }

    return categoryRankingsExist(urlParams)
  };

  const handleCategoryScroll = (event: React.UIEvent<HTMLDivElement>) => {
    setCategoryScrollPosition(event.currentTarget.scrollLeft);
  };

  const handleGetStarted = () => {
    setIsOverlayExit(true);
    const overlayDiv = document.querySelector('.overlay')!;
    overlayDiv.classList.add('slide-left');

    setTimeout(() => {
      setShowOverlay(false)
    }, 500); // for the animation duration
  };

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
   * When the vote code updates, make sure to refresh the ranked 
   * list so the new votes are displayed
   */
  useEffect(() => {
    setRefreshRankedList(Math.random())
  }, [vote]);

  /**
   * load the url if the user navigates using back/forward. 
   * this should provide and easier undo/redo workflow
   */
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {

      // User clicked back (or forward) button
      const decodeFromUrl = async () => {

        let category = areCategoriesSet() && !activeCategory ? 0 : activeCategory;

        const rankingsExist = await decodeRankingsFromURL(
          category,
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

    if (refreshUrl === 0) return;

    const updateLists = async () => {

      // Update the URL with the new active category
      if (categories?.length > 0 && activeCategory !== undefined) {
        updateQueryParams({ [`r${activeCategory + 1}`]: encodeRankingsToURL(rankedItems, activeCategory) });
      } else {
        updateQueryParams({ r: encodeRankingsToURL(rankedItems) });
      }
    };

    updateLists();
  }, [refreshUrl]);

  /**
   * Encode rankings to csv for URL
   * @param rankedCountries 
   * @returns 
   */
  const encodeRankingsToURL = (rankedCountries: CountryContestant[], categoryIndex?: number): string => {
    if (categories.length > 0 && categoryIndex !== undefined) {
      const ids = rankedCountries.map(item => item.id);
      return ids.join('');
    } else {
      const ids = rankedCountries.map(item => item.id);
      return ids.join('');
    }
  };

  /**
   * This loads any URL provided ranking on first page load
   */
  // useEffect(() => {
  //   const decodeFromUrl = async () => {

  //     let category = areCategoriesSet() && !activeCategory ? 0 : activeCategory;

  //     const rankingsExist = await decodeRankingsFromURL(
  //       category,
  //       dispatch
  //     );

  //     // console.log(category)
  //     // if (category !== undefined) {
  //     //   dispatch(
  //     //     setShowTotalRank(true)
  //     //   )
  //     // }

  //     // Set showUnranked based on whether rankings exist
  //     dispatch(
  //       setShowUnranked(!rankingsExist)
  //     );
  //   }
  //   decodeFromUrl();
  // }, [])

  /**
   * Determines whether to display the list view on first page load. If there 
   * are rankings in the URL show the list view, otherwise default to the select view
   */
  useEffect(() => {

    let category = areCategoriesSet() && !activeCategory ? 0 : activeCategory;

    const rankingsExist = urlHasRankings(
      category
    );

    // Set showUnranked based on whether rankings exist
    dispatch(
      setShowUnranked(!rankingsExist)
    );

  }, [])

  useEffect(() => {
    const updateRankedItems = async () => {

      if (!showTotalRank) {

        const rankingsExist = await decodeRankingsFromURL(
          activeCategory,
          dispatch
        );
      }
    };

    updateRankedItems();
  }, [activeCategory, showTotalRank]);

  useEffect(() => {
    const updateRankedItems = async () => {

      if (showTotalRank) {

        let totalOrderRankings = reorderByAllWeightedRankings(categories, rankedItems);

        // if it's already correctly ordered don't reset rankedItems
        if (isArrayEqual(totalOrderRankings, rankedItems)) {
          return;
        }

        dispatch(
          setRankedItems(totalOrderRankings)
        );
      }
    };

    updateRankedItems();
  }, [showTotalRank, rankedItems, categories]);


  useEffect(() => {
    const handleYearUpdate = async () => {
      if (!year?.length) {
        return;
      }
      updateQueryParams({ y: year.slice(-2) });
      await decodeRankingsFromURL(
        activeCategory,
        dispatch
      );
    }
    handleYearUpdate();
  }, [year]);

  useEffect(() => {
    updateQueryParams({ n: name });
  }, [name]);


  useEffect(() => {

    if (categories.length > 0) {
      // Add new category to the URL with the appropriate rx param
      categories.forEach((_, index) => {
        const categoryParam = `r${index + 1}`;
        const currentRanking = new URLSearchParams(window.location.search).get(categoryParam);

        if (!currentRanking) {
          const updatedRanking = encodeRankingsToURL(rankedItems, index);
          updateQueryParams({ [categoryParam]: updatedRanking });
        }
      });

      // Remove the r= ranking URL param if it exists
      const searchParams = new URLSearchParams(window.location.search);
      if (searchParams.has('r')) {
        searchParams.delete('r');
        const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
        window.history.replaceState(null, '', newUrl);
      }

      // Set activeCategory to 0 if it's currently undefined
      if (activeCategory === undefined) {
        dispatch(
          setActiveCategory(0)
        );
      }
    } else {
      // if there are no categories, make sure showTotalRank is false
      dispatch(
        setShowTotalRank(false)
      );
    }
  }, [categories]);

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

      dispatch(setOtherList(destinationItems));

      // Update the URL parameters for all categories
      categories.forEach((_, index) => {
        const categoryParam = `r${index + 1}`;
        const currentRanking = new URLSearchParams(window.location.search).get(categoryParam) || '';
        const updatedRanking = `${currentRanking}${reorderedItem.country.id}`;
        updateQueryParams({ [categoryParam]: updatedRanking });
      });

    } else {
      items.splice(destination.index, 0, reorderedItem);
      dispatch(setActiveList(items));
    }

    dispatch(setActiveList(items));
    setRefreshUrl(Math.random());
  };


  /**
   * Identify country with the provided Id in the rankedItems array, and 
   * move them back into the unrankedItems array, alphabetically 
   * 
   * @param countryId 
   */
  function deleteRankedCountry(id: string) {
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

    // Remove the country from each category ranking in the URL parameters
    removeCountryFromUrlCategoryRankings(categories, id);

    setRefreshUrl(Math.random());
  }

  function openMainModal(tabName: string): void {
    setModalTab(tabName);
    setMainModalShow(true)
  }

  function openConfigModal(tabName: string): void {
    setConfigModalTab(tabName);
    setConfigModalShow(true)
  }

  function openSongModal(countryCountestant: CountryContestant) {
    setSelectedCountryContestant(countryCountestant);
    setIsSongModalOpen(true);
  }

  return (
    <div className="overflow-hidden">

      {showOverlay && (
        <WelcomeOverlay
          exiting={isOverlayExit}
          handleGetStarted={handleGetStarted}
          handleTakeTour={() => {
            handleGetStarted();
            setRunTour(true);
          }}
        />
      )}

      <div
        className={classNames(
          "site-content flex flex-col h-screen tour-step-14 tour-step-15 tour-step-16 normal-bg",
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

            <div className="flex flex-row justify-center gap-4 px-4 py-2">
              {/* Unranked Countries List */}
              {showUnranked && (
                <div className="max-w-[50vw] overflow-y-auto flex-grow mr-1" >
                  <StrictModeDroppable droppableId="unrankedItems" key={`strict-md`}>
                    {(provided) => (
                      <ul
                        key={`ranked-list-${refreshRankedList}`}
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
              <div className="tour-step-5 z-20">
                <StrictModeDroppable droppableId="rankedItems">
                  {(provided) => (
                    <div
                      className={
                        classNames(
                          "grid h-full max-h-full min-h-full grid-rows-[auto_1fr]",
                        )}
                    >
                      <RankedItemsHeader
                        setMapModalShow={() => setMapModalShow(true)}
                        generateYoutubePlaylistUrl={generateYoutubePlaylistUrl}
                        supportedYears={supportedYears}
                        openNameModal={() => setNameModalShow(true)}
                        openConfig={openConfigModal}
                        className={showUnranked ? "min-w-[9em] max-w-50vw-6em" : "w-[80vw] max-w-[30.5em] min-w-[20.5em]"}
                      />

                      <div className="px-1 overflow-y-auto h-full">
                        <ul
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className={
                            classNames(
                              "overflow-y-auto overflow-x-hidden pt-3 bg-[#1d1b54] ranked-items-background w-full h-full",
                              showUnranked ? "min-w-[9em] max-w-50vw-6em" : "w-[80vw] max-w-[30em] min-w-[20em]",
                              { "auroral-background": theme.includes("ab") }
                            )}
                        >


                          {(rankedItems.length === 0 && showUnranked) && (
                            <IntroColumn
                              openModal={openMainModal}
                              openConfigModal={openConfigModal}
                              setRunTour={setRunTour}
                            />
                          )}
                          {rankedItems.map((item, index) => (
                            <Draggable
                              key={`draggable-${item.id.toString()}`}
                              draggableId={item.id.toString()}
                              index={index}
                              isDragDisabled={showTotalRank}
                            >
                              {(provided, snapshot) => {
                                return (
                                  <li
                                    key={`li-${item.id.toString()}`}
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={classNames("no-select m-2", { "mt-0": (index === 0) })}
                                  >
                                    {showUnranked ? (
                                      <Card
                                        key={`card-${item.id.toString()}`}
                                        className="m-auto text-slate-400 bg- bg-[#03022d] no-select"
                                        rank={index + 1}
                                        countryContestant={item}
                                        isDeleteMode={showUnranked && isDeleteMode}
                                        deleteCallBack={deleteRankedCountry}
                                        isDragging={snapshot.isDragging}
                                      />
                                    ) :
                                      <DetailsCard
                                        key={`card-${item.id.toString()}`}
                                        className="m-auto text-slate-400 bg- bg-[#03022d] no-select"
                                        rank={index + 1}
                                        countryContestant={item}
                                        openSongModal={() => openSongModal(item)}
                                        isDragging={snapshot.isDragging}
                                        categoryScrollPosition={categoryScrollPosition}
                                        onCategoryScroll={handleCategoryScroll}
                                      />

                                    }
                                  </li>
                                )
                              }}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </ul>
                      </div>
                      {(showUnranked && rankedItems?.length > 0) &&
                        <div className="pl-2 rounded-b-md h-8 bg-blue-900 ranked-bar-background text-slate-300 items-center flex shadow-md gradient-background">
                          <IconButton
                            className={
                              classNames(
                                "tour-step-4 ml-auto bg-blue-600 hover:bg-blue-700 text-white font-normal py-1 pl-[0.7em] pr-[0.9em] rounded-md text-xs mr-0 w-[6em]",
                                { "tada-animation": showUnranked && rankedItems?.length }
                              )}
                            onClick={() => dispatch(setShowUnranked(!showUnranked))}
                            title={'View List'}
                          />
                          <FaChevronRight
                            className={
                              classNames(
                                "ml-2 mr-auto text-lg justify-center align-center bounce-right text-blue-300",
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

        <div className="hidden fixed bottom-[3em] left-[1em] z-50" style={{}}>
          <div className='p-2 bg-slate-300 bg-opacity-40 rounded-lg'>
            <button
              onClick={() => {
                dispatch(
                  setShowUnranked(!showUnranked)
                );
              }}
              className={
                "w-[4em] py-3 bg-blue-900 hover:bg-blue-800 z-50 relative" +
                "overflow-hidden text-slate-200 font-normal py-1 px-3 " +
                "rounded-full border-slate-600 border-[0.1em] text-base shadow-lg " +
                "bg-opacity-80"
              }
            >
              <div className="text-slate-200">
                {showUnranked ? 'VIEW' : 'EDIT'}
              </div>
            </button>
          </div>
        </div>

        {(showUnranked && (!showOverlay || isOverlayExit)) &&
          <div className={`edit-nav-container ${(!showOverlay || isOverlayExit) && 'slide-up-animation'}`}>
            <EditNav
              setNameModalShow={setNameModalShow}
              setRefreshUrl={setRefreshUrl}
            />
          </div>
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

      <SongModal
        isOpen={isSongModalOpen}
        countryContestant={selectedCountryContestant}
        onClose={() => setIsSongModalOpen(false)}
      />

      <div className="tour-step-13">
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
      </div>
      <JoyrideTour
        setRefreshUrl={setRefreshUrl}
        openConfigModal={openConfigModal}
        setConfigModalShow={setConfigModalShow}
        setRunTour={setRunTour}
        runTour={runTour}
      />

      <Toaster
        toastOptions={toastOptions}
        position="top-center"
      />

    </div>
  );
};

export default App;