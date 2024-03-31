import React, { useEffect, useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import MainModal from './components/modals/MainModal';
import NameModal from './components/modals/NameModal';
import Navbar from './components/nav/NavBar';
import EditNav from './components/nav/EditNav';
import { AppState } from './redux/types';
import { useDispatch, useSelector } from 'react-redux';
import { setRankedItems, setUnrankedItems, setShowUnranked, setActiveCategory, setShowTotalRank } from './redux/actions';
import { decodeRankingsFromURL, encodeRankingsToURL, updateQueryParams, updateUrlFromRankedItems, urlHasRankings } from './utilities/UrlUtil';
import { Dispatch } from 'redux';
import MapModal from './components/modals/MapModal';
import ConfigModal from './components/modals/ConfigModal';
import WelcomeOverlay from './components/modals/WelcomeOverlay';
import SongModal from './components/modals/LyricsModal';
import { Toaster } from 'react-hot-toast';
import { toastOptions } from './utilities/ToasterUtil';
import { areCategoriesSet, categoryRankingsExist, reorderByAllWeightedRankings } from './utilities/CategoryUtil';
import { isArrayEqual } from './utilities/RankAnalyzer';
import JoyrideTour from './tour/JoyrideTour';
import { addWindowEventListeners, handlePopState, removeWindowEventListeners, setVh } from './utilities/EventListenerUtil';
import RankedCountriesList from './components/ranking/RankedCountriesList';
import UnrankedCountriesList from './components/ranking/UnrankedCountriesList';

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
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [selectedCountryContestant, setSelectedCountryContestant] = useState<CountryContestant | undefined>(undefined);
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

  const handleGetStarted = () => {
    setIsOverlayExit(true);
    const overlayDiv = document.querySelector('.overlay')!;
    overlayDiv.classList.add('slide-left');

    setTimeout(() => {
      setShowOverlay(false)
    }, 500); // for the animation duration
  };

  /**
 * When the vote code updates, make sure to refresh the ranked 
 * list so the new votes are displayed
 */
  useEffect(() => {
    setRefreshRankedList(Math.random())
  }, [vote]);


  useEffect(() => {
    if (refreshUrl === 0) return;
    updateUrlFromRankedItems(
      activeCategory, categories, rankedItems
    );
  }, [refreshUrl]);

  /**
    * First determines whether to display the list view on first page load. If there 
    * are rankings in the URL show the list view, otherwise default to the select view
    * 
    * Then, on return, load the url if the user navigates using back/forward. This should 
    * provide and easier undo/redo workflow. Also make sure the vertical height is correctly 
    * measured via --vh.
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

    // handle pop and vh event listners
    const handlePopStateCallback = (event: PopStateEvent) => {
      handlePopState(event, areCategoriesSet, activeCategory, dispatch);
    };

    addWindowEventListeners(
      setVh,
      handlePopStateCallback
    );

    setVh();

    return () => {
      removeWindowEventListeners(
        setVh,
        handlePopStateCallback
      );
    };

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
          const updatedRanking = encodeRankingsToURL(rankedItems);
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
                <UnrankedCountriesList />
              )}

              {/* Ranked Countries List */}
              <RankedCountriesList
                openSongModal={openSongModal}
                openModal={openMainModal}
                openConfigModal={openConfigModal}
                setRunTour={setRunTour}
                openNameModal={() => setNameModalShow(true)}
              />
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