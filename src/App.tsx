import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import { AppDispatch, AppState } from './redux/store';
import { setRankedItems, setUnrankedItems, setShowUnranked, setActiveCategory, setShowTotalRank, setCategories, setGlobalSearch } from './redux/rootSlice';
import { loadRankingsFromURL, encodeRankingsToURL, updateQueryParams, updateUrlFromRankedItems, urlHasRankings } from './utilities/UrlUtil';
import WelcomeOverlay from './components/modals/WelcomeOverlay';
import { Toaster } from 'react-hot-toast';
import { toastOptions } from './utilities/ToasterUtil';
import { areCategoriesSet, categoryRankingsExist, parseCategoriesUrlParam, reorderByAllWeightedRankings } from './utilities/CategoryUtil';
import { isArrayEqual } from './utilities/RankAnalyzer';
import { addWindowEventListeners, handlePopState, removeWindowEventListeners, setVh } from './utilities/EventListenerUtil';
import { useAppDispatch, useAppSelector } from './hooks/stateHooks';
import { Switch } from './components/Switch';
import TooltipHelp from './components/TooltipHelp';
import ContentPlaceholder from './components/ranking/ContentPlaceholder';
import EditNav from './components/nav/EditNav';
import { deleteRankedCountry } from './redux/rankingActions';
import { useModal, ModalType } from './hooks/useModal';

// lazy load components to reduce initial bundle size
const LazyRankedCountriesList = React.lazy(() => import('./components/ranking/RankedCountriesList'));
const LazyUnrankedCountriesList = React.lazy(() => import('./components/ranking/UnrankedCountriesList'));
const LazyRankedCountriesTable = React.lazy(() => import('./components/ranking/RankedCountriesTable'));
const LazyMainModal = React.lazy(() => import('./components/modals/MainModal'));
const LazyNameModal = React.lazy(() => import('./components/modals/NameModal'));
const LazyNavbar = React.lazy(() => import('./components/nav/NavBar'));
const LazyMapModal = React.lazy(() => import('./components/modals/MapModal'));
const LazyConfigModal = React.lazy(() => import('./components/modals/config/ConfigModal'));
const LazySongModal = React.lazy(() => import('./components/modals/LyricsModal'));
const LazyJoyrideTour = React.lazy(() => import('./tour/JoyrideTour'));

const App: React.FC = () => {
  const { modalState, openModal, closeModal, setModalTab, currentTab } = useModal('about');
  const [configModalTab, setConfigModalTab] = useState('display');
  const [refreshUrl, setRefreshUrl] = useState(0);
  const dispatch: AppDispatch = useAppDispatch();

  const showUnranked = useAppSelector((state: AppState) => state.showUnranked);
  const theme = useAppSelector((state: AppState) => state.theme);
  const name = useAppSelector((state: AppState) => state.name);
  const showTotalRank = useAppSelector((state: AppState) => state.showTotalRank);
  const rankedItems = useAppSelector((state: AppState) => state.rankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.unrankedItems);
  const year = useAppSelector((state: AppState) => state.year);
  const globalSearch = useAppSelector((state: AppState) => state.globalSearch);
  const categories = useAppSelector((state: AppState) => state.categories);
  const activeCategory = useAppSelector((state: AppState) => state.activeCategory);

  const [selectedCountryContestant, setSelectedCountryContestant] = useState<CountryContestant | undefined>(undefined);
  const [showOverlay, setShowOverlay] = useState(!areRankingsSet());
  const [isOverlayExit, setIsOverlayExit] = useState(false);

  const memoizedRankedItems = useMemo(() => rankedItems, [rankedItems]);
  const memoizedUnrankedItems = useMemo(() => unrankedItems, [unrankedItems]);

  const loadAuroralCSS = () => {
    return import('./auroral.css');
  };

  useEffect(() => {
    if (theme.includes('ab')) {
      loadAuroralCSS();
    }
  }, [theme]);

  /**
   * If we're switching to the unranked selection view from the 
   * total category ranking view, we should activate the first 
   * category. This is because the "total" is a pseudo ranking 
   * and immutable, whereas in the select view we want to 
   * add/remove contestants
   */
  useEffect(() => {
    if (showUnranked && categories?.length > 0 && showTotalRank) {
      dispatch(
        setShowTotalRank(false)
      )
      dispatch(
        setActiveCategory(
          0
        )
      )
    }
  }, [showUnranked]);

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

  const handleGetStarted = useCallback(() => {
    setIsOverlayExit(true);
    const overlayDiv = document.querySelector('.overlay')!;
    overlayDiv.classList.add('slide-left');

    setTimeout(() => {
      setShowOverlay(false)
    }, 500);

  }, []);


  useEffect(() => {
    if (refreshUrl === 0) return;
    updateUrlFromRankedItems(
      activeCategory, categories, memoizedRankedItems
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

  const updateGlobalSearch = (checked: boolean) => {
    updateQueryParams({ 'g': checked ? 't' : undefined });
    dispatch(
      setGlobalSearch(checked)
    );
  }

  /**
   * Reload the rankings from the URL if the activeCategory changes or 
   * if the user either displays or exits the totalRank tab
   */
  useEffect(() => {
    const updateRankedItems = async () => {
      if (!showTotalRank) {
        const rankingsExist = await loadRankingsFromURL(
          activeCategory,
          dispatch
        );
      } else if (activeCategory === undefined && categories?.length) {
        // if this is the first page load and we have categories we 
        // should load the first so that Total tab has contestants 
        // available to populated the total ranking
        const rankingsExist = await loadRankingsFromURL(
          0,
          dispatch
        );
      }
    };

    updateRankedItems();
  }, [activeCategory, showTotalRank]);


  /**
 * Load categories from the url
 */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoriesParam = searchParams.get('c');
    if (categoriesParam) {
      const parsedCategories = parseCategoriesUrlParam(categoriesParam);
      dispatch(
        setCategories(parsedCategories)
      )
    }
  }, []);

  useEffect(() => {
    const updateRankedItems = async () => {

      if (showTotalRank) {

        let totalOrderRankings = reorderByAllWeightedRankings(categories, memoizedRankedItems);

        // if it's already correctly ordered don't reset rankedItems
        if (isArrayEqual(totalOrderRankings, memoizedRankedItems)) {
          return;
        }

        dispatch(
          setRankedItems(totalOrderRankings)
        );
      }
    };

    updateRankedItems();
  }, [showTotalRank, memoizedRankedItems, categories]);

  useEffect(() => {
    const handleYearUpdate = async () => {
      if (!year?.length) {
        return;
      }
      updateQueryParams({ y: year.slice(-2) });

      await loadRankingsFromURL(
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
          const updatedRanking = encodeRankingsToURL(memoizedRankedItems);
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

      // If active category is undefined, then this is the 
      // first page load. In that case either
      // 1. if there are more than 1 categories, show the total view 
      // or 
      // 2. if there is only 1 category, just show that category ranking
      if (activeCategory === undefined) {

        if (categories?.length > 1) {
          dispatch(
            setShowTotalRank(true)
          );
        } else {
          dispatch(
            setActiveCategory(0)
          );
        }
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
  const handleOnDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;

    if (!destination) return;

    let activeList, setActiveList, otherList, setOtherList;


    const isDeleteFromRanking = source.droppableId === 'rankedItems' &&
      destination.droppableId === 'unrankedItems';

    if (source.droppableId === 'unrankedItems') {
      activeList = memoizedUnrankedItems;
      setActiveList = setUnrankedItems;
      otherList = memoizedRankedItems;
      setOtherList = setRankedItems;
    } else {
      activeList = memoizedRankedItems;
      setActiveList = setRankedItems;
      otherList = memoizedUnrankedItems;
      setOtherList = setUnrankedItems;
    }

    let items = Array.from(activeList);
    const [reorderedItem] = items.splice(source.index, 1);

    // moving between lists
    if (destination.droppableId !== source.droppableId) {
      let destinationItems = Array.from(otherList);

      destinationItems.splice(destination.index, 0, reorderedItem);

      if (isDeleteFromRanking) {
        // this is here especially to ensure that we delete from all category rankings,
        // and not just the currently selected one
        dispatch(
          deleteRankedCountry(reorderedItem.id)
        );
        setRefreshUrl(Math.random());
      } else {
        // Update the URL parameters for all categories 
        // (this adds the new item to all category rankings)
        let id = globalSearch ? reorderedItem.uid : reorderedItem.country.id;
        if (id) {
          addNewItemToAllCategoryRankings(id);
        } else {
          console.error('Contestant lacks valid ID:')
          console.error(reorderedItem);
        }
      }

      dispatch(setOtherList(destinationItems));

    } else {
      items.splice(destination.index, 0, reorderedItem);
      dispatch(setActiveList(items));
    }

    dispatch(setActiveList(items));
    setRefreshUrl(Math.random());
  }, [memoizedUnrankedItems, memoizedRankedItems, categories, dispatch]);

  function addNewItemToAllCategoryRankings(newContestantId: String) {
    categories.forEach((_, index) => {
      const categoryParam = `r${index + 1}`;
      const currentRanking = new URLSearchParams(window.location.search).get(categoryParam) || '';
      const updatedRanking = `${currentRanking}${newContestantId}`;
      updateQueryParams({ [categoryParam]: updatedRanking });
    });
  }

  // Helper functions to handle modal operations with selected tab
  function openMainModalWithTab(tabName: string): void {
    setModalTab(tabName);
    openModal('main');
  }

  function openConfigModalWithTab(tabName: string): void {
    setConfigModalTab(tabName);
    openModal('config');
  }

  function openSongModalWithData(countryContestant: CountryContestant) {
    setSelectedCountryContestant(countryContestant);
    openModal('song');
  }

  return (
    <div className="overflow-hidden">

      {showOverlay && (
        <WelcomeOverlay
          exiting={isOverlayExit}
          handleGetStarted={handleGetStarted}
          handleTakeTour={() => {
            handleGetStarted();
            openModal('tour');
          }}
        />
      )}

      <div
        className={classNames(
          "site-content flex flex-col h-screen tour-step-15 tour-step-16 tour-step-17 normal-bg",
          { 'star-sky': theme.includes('ab') }
        )}>

        {theme.includes("ab") &&
          <div className="star-container z-10">
            <div className="star" id="stars"></div>
            <div className="star" id="stars2"></div>
            <div className="star" id="stars3"></div>
          </div>
        }
        <Suspense fallback={<div />}>
          <LazyNavbar
            openModal={openMainModalWithTab}
            openConfigModal={openConfigModalWithTab}
          />
        </Suspense>

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
              {showUnranked && !globalSearch && (

                <div className="relative flex flex-col">
                  <div className="tour-step-14 sticky top-0 rounded-t-md round-b-sm text-center font-bold bg-blue-900 gradient-background-reverse text-slate-300 tracking-tighter shadow-md z-50">
                    <div className="flex items-center justify-center py-1 px-0">
                      <TooltipHelp
                        content="Select countries across all contest years"
                        className="text-slate-300 align-middle mb-1 -mr-1"
                      />
                      <Switch
                        label="adv"
                        className="items-center align-middle font-normal"
                        labelClassName="text-sm text-slate-400"
                        checked={globalSearch}
                        setChecked={updateGlobalSearch}
                      />
                    </div>
                  </div>
                  <Suspense fallback={<ContentPlaceholder />}>
                    <LazyUnrankedCountriesList />
                  </Suspense>
                </div>
              )}

              {/* Ranked Countries List */}

              {globalSearch && showUnranked ? (
                <Suspense fallback={<ContentPlaceholder />}>
                  <LazyRankedCountriesTable />
                </Suspense>
              ) :
                <Suspense fallback={<ContentPlaceholder />}>
                  <LazyRankedCountriesList
                    openSongModal={openSongModalWithData}
                    openModal={openMainModalWithTab}
                    openConfigModal={openConfigModalWithTab}
                    setRunTour={() => openModal('tour')}
                    openNameModal={() => openModal('name')}
                    openMapModal={() => openModal('map')}
                  />
                </Suspense>
              }
            </div>
          </DragDropContext>
        </div>

        <div className="hidden fixed bottom-[3em] left-[1em] z-50">
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
              setNameModalShow={() => openModal('name')}
            />
          </div>
        }
      </div>

      {/* Render all modals conditionally */}
      <Suspense fallback={<div />}>
        {(modalState.main.isOpen || modalState.main.hasRendered) && (
          <LazyMainModal
            tab={currentTab}
            isOpen={modalState.main.isOpen}
            onClose={() => closeModal('main')}
            startTour={() => {
              dispatch(setShowUnranked(true));
              openModal('tour');
            }}
          />
        )}

        {(modalState.name.isOpen || modalState.name.hasRendered) && (
          <LazyNameModal
            isOpen={modalState.name.isOpen}
            onClose={() => closeModal('name')}
          />
        )}

        {(modalState.song.isOpen || modalState.song.hasRendered) && (
          <LazySongModal
            isOpen={modalState.song.isOpen}
            countryContestant={selectedCountryContestant}
            onClose={() => closeModal('song')}
          />
        )}
      </Suspense>

      <div className="tour-step-13">
        {(modalState.config.isOpen || modalState.config.hasRendered) && (
          <Suspense fallback={<div />}>
            <LazyConfigModal
              tab={configModalTab}
              isOpen={modalState.config.isOpen}
              onClose={() => closeModal('config')}
              startTour={() => {
                dispatch(setShowUnranked(true));
                openModal('tour');
              }}
            />
          </Suspense>
        )}
      </div>

      {(modalState.map.isOpen || modalState.map.hasRendered) && (
        <Suspense fallback={<div />}>
          <LazyMapModal
            isOpen={modalState.map.isOpen}
            onClose={() => closeModal('map')}
          />
        </Suspense>
      )}

      {(modalState.tour.isOpen || modalState.tour.hasRendered) && (
        <Suspense fallback={<div />}>
          <LazyJoyrideTour
            setRefreshUrl={setRefreshUrl}
            openConfigModal={openConfigModalWithTab}
            setConfigModalShow={(show) => show ? openModal('config') : closeModal('config')}
            setRunTour={(run) => run ? openModal('tour') : closeModal('tour')}
            runTour={modalState.tour.isOpen}
          />
        </Suspense>
      )}

      <Toaster
        toastOptions={toastOptions}
        position="top-center"
      />

    </div>
  );
};

export default App;