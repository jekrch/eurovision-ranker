import { logger } from './utilities/logger';
import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import { AppDispatch, AppState } from './redux/store';
import { setRankedItems, setShowUnranked, setActiveCategory, setShowTotalRank, setCategories, setGlobalSearch, setTheme, patchUser } from './redux/rootSlice';
import { loadRankingsFromURL, encodeRankingsToURL, updateQueryParams, updateUrlFromRankedItems, urlHasRankings } from './utilities/UrlUtil';
import WelcomeOverlay from './components/modals/WelcomeOverlay';
import { Toaster } from 'react-hot-toast';
import { toastOptions } from './utilities/ToasterUtil';
import { SKIP_WELCOME_AFTER_TOUR_KEY } from './utilities/JoyrideUtil';
import { areCategoriesSet, parseCategoriesUrlParam, reorderByAllWeightedRankings } from './utilities/CategoryUtil';
import { isArrayEqual } from './utilities/RankAnalyzer';
import { addWindowEventListeners, handlePopState, removeWindowEventListeners, setVh } from './utilities/EventListenerUtil';
import { useAppDispatch, useAppSelector } from './hooks/stateHooks';
import { Switch } from './components/Switch';
import TooltipHelp from './components/TooltipHelp';
import ContentPlaceholder from './components/ranking/ContentPlaceholder';
import EditNav from './components/nav/EditNav';
import { useModal } from './hooks/useModal';
import { VideoPipProvider } from './components/video/VideoPipContext';
import SorterModal from './components/ranking/SorterModal';
import useSorterModal from './hooks/useSortModal';
import { useThemeEffect } from './hooks/useThemeEffect';
import { usePublicRankingView } from './hooks/usePublicRankingView';
import { useRankingDragDrop } from './hooks/useRankingDragDrop';
import AuthModal, { AuthView } from './components/modals/auth/AuthModal';
import JoinGroupModal from './components/modals/groups/JoinGroupModal';
import { ping } from './utilities/api/health';
import { getMe } from './utilities/api/me';
import {
  cameFromTour,
  areRankingsSet,
  isAuthDeepLink,
  hasIdParam,
  hasQuizCode,
  hasJoinToken,
} from './utilities/deepLinkUtil';

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
const LazyQuizModal = React.lazy(() => import('./components/modals/quiz/QuizModal'));
const LazyJoyrideTour = React.lazy(() => import('./tour/JoyrideTour'));
const LazyJoyrideTourSort = React.lazy(() => import('./tour/JoyrideTourSort'));

const App: React.FC = () => {
  const { modalState, openModal, closeModal, setModalTab, currentTab } = useModal('about');
  const [configModalTab, setConfigModalTab] = useState('display');
  // Incremented on forced opens so the ConfigModal jumps to the requested tab
  // even when the tab string is unchanged (overriding its sticky-tab memory).
  const [configTabNonce, setConfigTabNonce] = useState(0);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const dispatch: AppDispatch = useAppDispatch();

  const showUnranked = useAppSelector((state: AppState) => state.root.showUnranked);
  const theme = useAppSelector((state: AppState) => state.root.theme);
  const name = useAppSelector((state: AppState) => state.root.name);
  const showTotalRank = useAppSelector((state: AppState) => state.root.showTotalRank);
  const rankedItems = useAppSelector((state: AppState) => state.root.rankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const year = useAppSelector((state: AppState) => state.root.year);
  const globalSearch = useAppSelector((state: AppState) => state.root.globalSearch);
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);

  const [selectedCountryContestant, setSelectedCountryContestant] = useState<CountryContestant | undefined>(undefined);
  const [showOverlay, setShowOverlay] = useState(!cameFromTour() && !areRankingsSet() && !isAuthDeepLink() && !hasIdParam() && !hasJoinToken() && !hasQuizCode());
  const [isOverlayExit, setIsOverlayExit] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView | undefined>(undefined);
  const [authModalAllowRegister, setAuthModalAllowRegister] = useState(false);
  const [joinGroupToken, setJoinGroupToken] = useState<string | null>(null);
  const [quizModalOpen, setQuizModalOpen] = useState(false);
  // a ?quiz=<code> deep link replays the exact same quiz; null = normal setup
  const [quizCode, setQuizCode] = useState<string | null>(null);
  //const [isDevModalOpen, setIsDevModalOpen] = useState(true);
  const memoizedRankedItems = useMemo(() => rankedItems, [rankedItems]);
  const memoizedUnrankedItems = useMemo(() => unrankedItems, [unrankedItems]);
  useThemeEffect(); 

  const {
    isSorterModalOpen,
    openSorterModal,
    closeSorterModal,
    getItemsToSort
  } = useSorterModal();

  // Public-view-by-id mode: when active, the URL is just `?id=<ranking_id>`
  // and we suppress the n/y/r URL-writing effects so the share URL stays
  // tidy. The first user-initiated change (drag/drop, year change, rename)
  // exits the mode and re-syncs the URL.
  const {
    publicViewActiveRef,
    publicViewLoadedRef,
    loadedNameRef,
    loadedYearRef,
    loadPublicRankingById,
    exitPublicView,
  } = usePublicRankingView({ activeCategory, name, year, dispatch });

  const loadAuroralCSS = () => {
    return import('./auroral.css');
  };

  useEffect(() => {
    if (theme.includes('ab')) {
      loadAuroralCSS();
    } else {
      setTheme(theme)
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
    if (publicViewActiveRef.current) {
      // First user edit — exit public view and let URL track state normally.
      exitPublicView();
    }
    updateUrlFromRankedItems(
      activeCategory, categories, memoizedRankedItems
    );
  }, [refreshUrl]);

  // boot: handle email-link deep paths, ?signup=beta gate, API reachability probe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;

    const stripParamsAndPath = (paramKeys: string[]) => {
      const sp = new URLSearchParams(window.location.search);
      paramKeys.forEach((k) => sp.delete(k));
      // Reset path to the SPA root for gh-pages-friendly deep links.
      const newPath = window.location.origin + '/';
      const newSearch = sp.toString();
      window.history.replaceState(null, '', newPath + (newSearch ? `?${newSearch}` : ''));
    };

    if (path.endsWith('/complete-registration')) {
      const token = params.get('token') || '';
      setAuthModalView({ tab: 'register', step: 2, token });
      setAuthModalAllowRegister(true);
      setAuthModalOpen(true);
      stripParamsAndPath(['token']);
    } else if (path.endsWith('/reset-password')) {
      const token = params.get('token') || '';
      setAuthModalView({ tab: 'reset', step: 2, token });
      setAuthModalAllowRegister(false);
      setAuthModalOpen(true);
      stripParamsAndPath(['token']);
    } else if (params.get('signup') === 'beta') {
      setAuthModalView({ tab: 'register', step: 1 });
      setAuthModalAllowRegister(true);
      setAuthModalOpen(true);
      stripParamsAndPath(['signup']);
    } else if (path.endsWith('/join-group') && params.get('token')) {
      // Canonical invite link: /join-group?token=…
      setJoinGroupToken(params.get('token'));
      stripParamsAndPath(['token']);
    } else if (params.get('join')) {
      // Query-only fallback for static hosts that can't route /join-group.
      setJoinGroupToken(params.get('join'));
      stripParamsAndPath(['join']);
    }

    // ?quiz=<code> — open the quiz modal and replay the exact same quiz.
    const quizParam = params.get('quiz');
    if (quizParam) {
      setQuizCode(quizParam);
      setQuizModalOpen(true);
      stripParamsAndPath(['quiz']);
    }

    // ?id=<ranking_id> — fetch a public ranking and load it. Set the flag
    // synchronously so the other on-mount effects don't write n/y/load
    // anything stale before the fetch resolves.
    const idParam = params.get('id');
    if (idParam) {
      publicViewActiveRef.current = true;
      loadPublicRankingById(idParam);
    }

    // Fire-and-forget reachability check; surface only on dev console.
    ping().catch((e) => {
      if (import.meta.env.DEV) logger.warn('API healthz failed', e);
    });
  }, []);

  // Hydrate the signed-in user's username from /api/me whenever the auth token
  // appears (page load with a stored token, or a fresh in-session login). JWTs
  // issued before the username feature don't carry it, so we fetch rather than
  // read the token. Best-effort: failures (offline, expired token) are non-fatal.
  const token = useAppSelector((state: AppState) => state.auth.token);
  useEffect(() => {
    if (!token) return;
    getMe()
      .then((me) => dispatch(patchUser({ username: me.username })))
      .catch(() => { /* ignore */ });
  }, [token]);

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

    // If we just returned from a tour, clear the one-shot flag and force the
    // select view rather than deriving it from the restored URL.
    if (cameFromTour()) {
      try {
        sessionStorage.removeItem(SKIP_WELCOME_AFTER_TOUR_KEY);
      } catch { /* sessionStorage may be unavailable */ }
      dispatch(
        setShowUnranked(true)
      );
    } else {
      // Set showUnranked based on whether rankings exist
      dispatch(
        setShowUnranked(!rankingsExist)
      );
    }

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
      // Public-view-by-id loads rankings directly; the URL has no r= so
      // loadRankingsFromURL would just clear them.
      if (publicViewActiveRef.current) return;
      if (!showTotalRank) {
        await loadRankingsFromURL(
          activeCategory,
          dispatch
        );
      } else if (activeCategory === undefined && categories?.length) {
        // if this is the first page load and we have categories we
        // should load the first so that Total tab has contestants
        // available to populated the total ranking
        await loadRankingsFromURL(
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
      // In public-view mode, the dispatched year matches the loaded value —
      // skip URL write and the redundant reload. If the user later picks a
      // different year, exit public view and behave normally.
      if (publicViewActiveRef.current) {
        // Fetch in flight: refs aren't populated yet, so any compare would
        // be bogus. Suppress until loadPublicRankingById finishes.
        if (!publicViewLoadedRef.current) return;
        if (year === loadedYearRef.current) return;
        exitPublicView();
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
    if (publicViewActiveRef.current) {
      if (!publicViewLoadedRef.current) return;
      if (name === loadedNameRef.current) return;
      exitPublicView();
    }
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

  // Drag-and-drop + add-to-ranked handlers, including keeping every category
  // ranking in the URL in sync. Extracted to keep App focused on composition.
  const { handleOnDragEnd, handleAddToRanked } = useRankingDragDrop({
    rankedItems: memoizedRankedItems,
    unrankedItems: memoizedUnrankedItems,
    globalSearch,
    categories,
    dispatch,
    setRefreshUrl,
  });

  // Helper functions to handle modal operations with selected tab
  function openMainModalWithTab(tabName: string): void {
    setModalTab(tabName);
    openModal('main');
  }

  function openConfigModalWithTab(tabName: string, force = false): void {
    setConfigModalTab(tabName);
    if (force) {
      setConfigTabNonce((n) => n + 1);
    }
    openModal('config');
  }

  function openSongModalWithData(countryContestant: CountryContestant) {
    setSelectedCountryContestant(countryContestant);
    openModal('song');
  }

  // re-open the song modal when the user expands a floating (pip) video; the
  // modal's video tab then re-docks the still-playing player
  const handleExpandVideo = useCallback((countryContestant: CountryContestant) => {
    setSelectedCountryContestant(countryContestant);
    openModal('song');
  }, []);

  const openLoginModal = useCallback(() => {
    setAuthModalView({ tab: 'login' });
    setAuthModalAllowRegister(false);
    setAuthModalOpen(true);
  }, []);

  return (
    <VideoPipProvider onExpand={handleExpandVideo} onMinimize={() => closeModal('song')}>
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
          "site-content flex flex-col tour-step-16 tour-step-17 tour-step-18 normal-bg",
          {
            'star-sky': theme.includes('ab'),
            'view-mode': !showUnranked,
            'h-screen': showUnranked,
          }
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

            <div className={classNames(
              "flex flex-row justify-center gap-4 py-2",
              globalSearch ? "px-1 sm:px-4" : "px-4"
            )}>

              {/* Unranked Countries List */}
              {showUnranked && !globalSearch && (

                <div className="relative flex flex-col">
                  <div className="tour-step-15 sticky top-0 rounded-t-md round-b-sm text-center font-bold bg-[var(--er-surface-bar)] gradient-background-reverse text-[var(--er-text-secondary)] tracking-tighter shadow-md z-50">
                    <div className="flex items-center justify-center gap-1 py-1 px-0">
                      <TooltipHelp
                        content="Select countries across all contest years"
                        className="text-[var(--er-text-secondary)] align-middle mb-1 mr-1 -ml-1"
                      />
                      <Switch
                        label="adv"
                        className="items-center align-middle font-normal"
                        labelClassName="text-sm text-[var(--er-text-tertiary)]"
                        checked={globalSearch}
                        setChecked={updateGlobalSearch}
                      />
                    </div>
                  </div>
                  <Suspense fallback={<ContentPlaceholder />}>
                    <LazyUnrankedCountriesList onAddToRanked={handleAddToRanked} />
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
                    setRunSortTour={() => openModal('sortTour')}
                    openNameModal={() => openModal('name')}
                    openMapModal={() => openModal('map')}
                    openSorterModal={openSorterModal}
                    openAuthModal={openLoginModal}
                    openQuizModal={() => setQuizModalOpen(true)}
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
                "w-[4em] py-3 bg-[var(--er-surface-bar)] hover:bg-[var(--er-interactive-dark)] z-50 relative" +
                "overflow-hidden text-[var(--er-text-primary)] font-normal py-1 px-3 " +
                "rounded-full border-[var(--er-border-tertiary)] border-[0.1em] text-base shadow-lg " +
                "bg-opacity-80"
              }
            >
              <div className="text-[var(--er-text-primary)]">
                {showUnranked ? 'VIEW' : 'EDIT'}
              </div>
            </button>
          </div>
        </div>

        {(showUnranked && (!showOverlay || isOverlayExit)) &&
          /* `key` is derived from the theme so a theme switch REMOUNTS just this
             EditNav (the bar whose dark fill the iOS Safari bottom toolbar
             samples). Replacing this exact node forces iOS to re-sample its tint
             to the new theme color, while the main list above is left untouched
             (no glitchy reload). The bar's slide-up animation replays on remount,
             which is the accepted trade-off. */
          <div
            key={`edit-nav-${theme}`}
            className={`edit-nav-container ${(!showOverlay || isOverlayExit) && 'slide-up-animation'}`}>
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

      <div className="tour-step-14 sort-tour-step-modal">
        {(modalState.config.isOpen || modalState.config.hasRendered) && (
          <Suspense fallback={<div />}>
            <LazyConfigModal
              tab={configModalTab}
              tabRequestNonce={configTabNonce}
              isOpen={modalState.config.isOpen}
              onClose={() => closeModal('config')}
              startTour={() => {
                dispatch(setShowUnranked(true));
                openModal('tour');
              }}
              openAuthModal={openLoginModal}
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

      {(modalState.sortTour.isOpen || modalState.sortTour.hasRendered) && (
        <Suspense fallback={<div />}>
          <LazyJoyrideTourSort
            openSortModal={openSorterModal}
            setRefreshUrl={setRefreshUrl}
            openConfigModal={openConfigModalWithTab}
            setConfigModalShow={(show) => show ? openModal('config') : closeModal('config')}
            setRunTour={(run) => run ? openModal('sortTour') : closeModal('sortTour')}
            runTour={modalState.sortTour.isOpen}
            closeSortModal={closeSorterModal}
          />
        </Suspense>
      )}

      {/* Include the sorter modal */}
      <SorterModal
        isOpen={isSorterModalOpen}
        onClose={closeSorterModal}
        initialItems={getItemsToSort()}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialView={authModalView}
        allowRegister={authModalAllowRegister}
        onAuthSuccess={() => {
          // Pre-seed the ConfigModal's sticky-tab storage so a first-mount
          // (modal never opened this session) still lands on Account.
          try { localStorage.setItem('configModalActiveTab', 'account'); } catch { /* ignore */ }
          openConfigModalWithTab('account');
        }}
      />

      {quizModalOpen && (
        <Suspense fallback={<div />}>
          <LazyQuizModal
            isOpen={quizModalOpen}
            initialCode={quizCode}
            onClose={() => {
              setQuizModalOpen(false);
              setQuizCode(null);
            }}
          />
        </Suspense>
      )}

      <JoinGroupModal
        isOpen={!!joinGroupToken}
        token={joinGroupToken}
        onClose={() => setJoinGroupToken(null)}
        onSignInRequired={openLoginModal}
        onJoined={() => {
          // Sticky-tab so the Groups tab is what they see when the
          // config modal opens.
          try { localStorage.setItem('configModalActiveTab', 'groups'); } catch { /* ignore */ }
          openConfigModalWithTab('groups');
        }}
      />

      {/* <CanvasDevModal
          isOpen={isDevModalOpen}
          onClose={() => setIsDevModalOpen(false)}
        /> */}

      <Toaster
        toastOptions={toastOptions}
        position="top-center"
      />

    </div>
    </VideoPipProvider>
  );
};

export default App;