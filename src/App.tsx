import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DragDropContext, DropResult } from '@hello-pangea/dnd';
import classNames from 'classnames';
import { CountryContestant } from './data/CountryContestant';
import { AppDispatch, AppState } from './redux/store';
import { setRankedItems, setUnrankedItems, setShowUnranked, setActiveCategory, setShowTotalRank, setCategories, setGlobalSearch, setTheme, setName, setYear, setCurrentRankingId, setLastSavedSignature, setLoadedAuthor, patchUser } from './redux/rootSlice';
import { loadRankingsFromURL, encodeRankingsToURL, updateQueryParams, updateUrlFromRankedItems, urlHasRankings } from './utilities/UrlUtil';
import WelcomeOverlay from './components/modals/WelcomeOverlay';
import toast, { Toaster } from 'react-hot-toast';
import { toastOptions } from './utilities/ToasterUtil';
import { SKIP_WELCOME_AFTER_TOUR_KEY } from './utilities/JoyrideUtil';
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
import { VideoPipProvider } from './components/video/VideoPipContext';
import CanvasDevModal from './components/ranking/CanvasDevModal';
import SorterModal from './components/ranking/SorterModal';
import useSorterModal from './hooks/useSortModal';
import { useThemeEffect } from './hooks/useThemeEffect';
import AuthModal, { AuthView } from './components/modals/auth/AuthModal';
import JoinGroupModal from './components/modals/groups/JoinGroupModal';
import { ping } from './utilities/api/health';
import { getPublicRanking, getRanking } from './utilities/api/rankings';
import { getMe } from './utilities/api/me';
import { getToken } from './utilities/api/client';
import { parseStoredRanking } from './utilities/api/rankingParams';
import { signatureFromRanking } from './utilities/api/rankingSignature';
import { ApiError } from './utilities/api/types';

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
const LazyJoyrideTourSort = React.lazy(() => import('./tour/JoyrideTourSort'));

const App: React.FC = () => {
  const { modalState, openModal, closeModal, setModalTab, currentTab } = useModal('about');
  const [configModalTab, setConfigModalTab] = useState('display');
  const [refreshUrl, setRefreshUrl] = useState(0);
  const dispatch: AppDispatch = useAppDispatch();

  // Public-view-by-id mode: when active, the URL is just `?id=<ranking_id>`
  // and we suppress the n/y/r URL-writing effects so the share URL stays
  // tidy. The first user-initiated change (drag/drop, year change, rename)
  // exits the mode and re-syncs the URL.
  const publicViewActiveRef = useRef(false);
  const publicViewLoadedRef = useRef(false);
  const loadedNameRef = useRef<string>('');
  const loadedYearRef = useRef<string>('');

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
  const [showOverlay, setShowOverlay] = useState(!cameFromTour() && !areRankingsSet() && !isAuthDeepLink() && !hasIdParam() && !hasJoinToken());
  const [isOverlayExit, setIsOverlayExit] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalView, setAuthModalView] = useState<AuthView | undefined>(undefined);
  const [authModalAllowRegister, setAuthModalAllowRegister] = useState(false);
  const [joinGroupToken, setJoinGroupToken] = useState<string | null>(null);
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

  /**
   * Whether the app was just reloaded as a result of exiting a tour. When true,
   * we skip the welcome overlay and send the user straight to the select view.
   * This only peeks at the flag — the boot effect clears it once consumed.
   */
  function cameFromTour() {
    try {
      return sessionStorage.getItem(SKIP_WELCOME_AFTER_TOUR_KEY) === '1';
    } catch {
      return false;
    }
  }

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

  // Auth deep-links (?signup=beta, /complete-registration, /reset-password) should
  // skip the welcome overlay — otherwise it covers the AuthModal and a click on the
  // overlay outside the auth modal can close the auth modal too.
  function isAuthDeepLink() {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    return (
      path.endsWith('/complete-registration') ||
      path.endsWith('/reset-password') ||
      path.endsWith('/join-group') ||
      params.get('signup') === 'beta'
    );
  }

  function hasIdParam() {
    return !!new URLSearchParams(window.location.search).get('id');
  }

  // Invite deep-links come in two shapes:
  //   /join-group?token=…  (the canonical link the API builds)
  //   ?join=…              (query-only fallback for gh-pages-style hosts
  //                          that don't rewrite unknown paths to index.html)
  function hasJoinToken(): boolean {
    const params = new URLSearchParams(window.location.search);
    const path = window.location.pathname;
    return (path.endsWith('/join-group') && !!params.get('token')) || !!params.get('join');
  }

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
      if (import.meta.env.DEV) console.warn('API healthz failed', e);
    });
  }, []);

  // Hydrate the signed-in user's username from /api/me whenever the auth token
  // appears (page load with a stored token, or a fresh in-session login). JWTs
  // issued before the username feature don't carry it, so we fetch rather than
  // read the token. Best-effort: failures (offline, expired token) are non-fatal.
  const token = useAppSelector((state: AppState) => state.token);
  useEffect(() => {
    if (!token) return;
    getMe()
      .then((me) => dispatch(patchUser({ username: me.username })))
      .catch(() => { /* ignore */ });
  }, [token]);

  async function loadPublicRankingById(id: string) {
    try {
      // When signed in, use the authenticated endpoint: it returns the
      // caller's own rankings, public rankings, and non-public rankings shared
      // with a group they belong to. Anonymous visitors get public-only.
      const full = getToken() ? await getRanking(id) : await getPublicRanking(id);
      const loadedName = full.name || '';
      const loadedYear = full.year != null ? String(full.year) : '';
      const yearShort = full.year != null ? String(full.year).slice(-2) : undefined;

      loadedNameRef.current = loadedName;
      loadedYearRef.current = loadedYear;
      // Mark loaded *before* dispatching so the n/y useEffects, which fire
      // after the dispatches, can compare against the loaded values rather
      // than treating themselves as user actions.
      publicViewLoadedRef.current = true;

      // Temporarily replace the URL search with the saved params + n/y so
      // loadRankingsFromURL can read them, then strip back to ?id=<id> below.
      // `full.ranking` may be the new query-string format (e.g. r=…&r1=…&v=…)
      // or the legacy raw r-value — parseStoredRanking handles both.
      const sp = parseStoredRanking(full.ranking ?? '');
      if (loadedName) sp.set('n', loadedName);
      if (yearShort) sp.set('y', yearShort);
      sp.set('id', id);
      window.history.pushState(null, '', '?' + sp.toString());

      dispatch(setName(loadedName));
      if (loadedYear) dispatch(setYear(loadedYear));

      await loadRankingsFromURL(activeCategory, dispatch);

      // Keep the URL tidy: just ?id=<id>. The n/y/refreshUrl effects below
      // check publicViewActiveRef and won't write back.
      window.history.pushState(null, '', '?id=' + encodeURIComponent(id));

      dispatch(setShowUnranked(false));

      // Tie into the shared dirty-tracking mechanism so the header can show a
      // subtle "loaded ranking by <author>" indicator that disappears on the
      // first edit (when the live signature diverges from this baseline).
      dispatch(setCurrentRankingId(full.ranking_id));
      dispatch(setLastSavedSignature(signatureFromRanking(full)));
      dispatch(setLoadedAuthor({
        username: full.author_username,
        email: full.author_email,
        userId: full.user_id,
      }));
    } catch (e) {
      publicViewActiveRef.current = false;
      publicViewLoadedRef.current = false;
      dispatch(setLoadedAuthor(null));
      if (e instanceof ApiError && e.status === 404) {
        toast.error('That ranking is not available.');
      } else if (e instanceof ApiError) {
        toast.error(e.body?.trim() || 'Failed to load ranking.');
      } else {
        toast.error('Failed to load ranking.');
      }
      updateQueryParams({ id: undefined });
    }
  }

  function exitPublicView() {
    publicViewActiveRef.current = false;
    // Restore n/y in URL since we suppressed those writes while in public view.
    updateQueryParams({
      id: undefined,
      n: name || undefined,
      y: year ? year.slice(-2) : undefined,
    });
  }

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

  const handleAddToRanked = useCallback((item: CountryContestant) => {
    const sourceIndex = memoizedUnrankedItems.findIndex(i => i.id === item.id);
    if (sourceIndex === -1) return;

    const newUnranked = Array.from(memoizedUnrankedItems);
    newUnranked.splice(sourceIndex, 1);

    const newRanked = [...memoizedRankedItems, item];

    const id = globalSearch ? item.uid : item.country.id;
    if (id) {
      addNewItemToAllCategoryRankings(id);
    }

    dispatch(setRankedItems(newRanked));
    dispatch(setUnrankedItems(newUnranked));
    setRefreshUrl(Math.random());
  }, [memoizedUnrankedItems, memoizedRankedItems, globalSearch, categories, dispatch]);

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

            <div className="flex flex-row justify-center gap-4 px-4 py-2">

              {/* Unranked Countries List */}
              {showUnranked && !globalSearch && (

                <div className="relative flex flex-col">
                  <div className="tour-step-15 sticky top-0 rounded-t-md round-b-sm text-center font-bold bg-[var(--er-surface-bar)] gradient-background-reverse text-[var(--er-text-secondary)] tracking-tighter shadow-md z-50">
                    <div className="flex items-center justify-center py-1 px-0">
                      <TooltipHelp
                        content="Select countries across all contest years"
                        className="text-[var(--er-text-secondary)] align-middle mb-1 -mr-1"
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

      <div className="tour-step-14 sort-tour-step-modal">
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