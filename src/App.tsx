import React, { useCallback, useEffect, useMemo, useState } from 'react';

import AppContent from './components/AppContent';
import AppModals from './components/AppModals';
import { AuthView } from './components/modals/auth/AuthModal';
import WelcomeOverlay from './components/modals/WelcomeOverlay';
import { VideoPipProvider } from './components/video/VideoPipContext';
import { CountryContestant } from './data/CountryContestant';
import { useAppDispatch, useAppSelector } from './hooks/stateHooks';
import { useModal } from './hooks/useModal';
import { usePublicRankingView } from './hooks/usePublicRankingView';
import { useRankingDragDrop } from './hooks/useRankingDragDrop';
import useSorterModal from './hooks/useSortModal';
import { useThemeEffect } from './hooks/useThemeEffect';
import { useUrlSync } from './hooks/useUrlSync';
import {
  setShowUnranked,
  setActiveCategory,
  setShowTotalRank,
  setGlobalSearch,
  setTheme,
  patchUser,
} from './redux/rootSlice';
import { AppDispatch, AppState } from './redux/store';
import { ping } from './utilities/api/health';
import { getMe } from './utilities/api/me';
import { areCategoriesSet } from './utilities/CategoryUtil';
import {
  cameFromTour,
  areRankingsSet,
  isAuthDeepLink,
  hasIdParam,
  hasQuizCode,
  hasJoinToken,
} from './utilities/deepLinkUtil';
import {
  addWindowEventListeners,
  handlePopState,
  removeWindowEventListeners,
  setVh,
} from './utilities/EventListenerUtil';
import { SKIP_WELCOME_AFTER_TOUR_KEY } from './utilities/JoyrideUtil';
import { logger } from './utilities/logger';
import { updateQueryParams, updateUrlFromRankedItems, urlHasRankings } from './utilities/UrlUtil';

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

  const [selectedCountryContestant, setSelectedCountryContestant] = useState<
    CountryContestant | undefined
  >(undefined);
  const [showOverlay, setShowOverlay] = useState(
    !cameFromTour() &&
      !areRankingsSet() &&
      !isAuthDeepLink() &&
      !hasIdParam() &&
      !hasJoinToken() &&
      !hasQuizCode(),
  );
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

  const { isSorterModalOpen, openSorterModal, closeSorterModal, getItemsToSort } = useSorterModal();

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
      setTheme(theme);
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
      dispatch(setShowTotalRank(false));
      dispatch(setActiveCategory(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnranked]);

  const handleGetStarted = useCallback(() => {
    setIsOverlayExit(true);
    const overlayDiv = document.querySelector('.overlay')!;
    overlayDiv.classList.add('slide-left');

    setTimeout(() => {
      setShowOverlay(false);
    }, 500);
  }, []);

  useEffect(() => {
    if (refreshUrl === 0) return;
    if (publicViewActiveRef.current) {
      // First user edit — exit public view and let URL track state normally.
      exitPublicView();
    }
    updateUrlFromRankedItems(activeCategory, categories, memoizedRankedItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      .catch(() => {
        /* ignore */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const category = areCategoriesSet() && !activeCategory ? 0 : activeCategory;

    const rankingsExist = urlHasRankings(category);

    // If we just returned from a tour, clear the one-shot flag and force the
    // select view rather than deriving it from the restored URL.
    if (cameFromTour()) {
      try {
        sessionStorage.removeItem(SKIP_WELCOME_AFTER_TOUR_KEY);
      } catch {
        /* sessionStorage may be unavailable */
      }
      dispatch(setShowUnranked(true));
    } else {
      // Set showUnranked based on whether rankings exist
      dispatch(setShowUnranked(!rankingsExist));
    }

    // handle pop and vh event listners
    const handlePopStateCallback = (event: PopStateEvent) => {
      handlePopState(event, areCategoriesSet, activeCategory, dispatch);
    };

    addWindowEventListeners(setVh, handlePopStateCallback);

    setVh();

    return () => {
      removeWindowEventListeners(setVh, handlePopStateCallback);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateGlobalSearch = (checked: boolean) => {
    updateQueryParams({ g: checked ? 't' : undefined });
    dispatch(setGlobalSearch(checked));
  };

  // URL <-> state synchronization: reload on category/total-rank change, load
  // categories from the URL, keep the per-category rx (and y/n) params written,
  // and the first-load category/total-rank bootstrap. Declared here because its
  // effects are ordering-sensitive (they must run after the boot/deep-link
  // effects above) — see useUrlSync.
  useUrlSync({
    activeCategory,
    showTotalRank,
    categories,
    year,
    name,
    rankedItems: memoizedRankedItems,
    dispatch,
    publicViewActiveRef,
    publicViewLoadedRef,
    loadedNameRef,
    loadedYearRef,
    exitPublicView,
  });

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

        <AppContent
          theme={theme}
          showUnranked={showUnranked}
          globalSearch={globalSearch}
          showOverlay={showOverlay}
          isOverlayExit={isOverlayExit}
          dispatch={dispatch}
          handleOnDragEnd={handleOnDragEnd}
          handleAddToRanked={handleAddToRanked}
          updateGlobalSearch={updateGlobalSearch}
          openSongModalWithData={openSongModalWithData}
          openMainModalWithTab={openMainModalWithTab}
          openConfigModalWithTab={openConfigModalWithTab}
          openModal={openModal}
          openSorterModal={openSorterModal}
          openLoginModal={openLoginModal}
          setQuizModalOpen={setQuizModalOpen}
        />

        <AppModals
          modalState={modalState}
          currentTab={currentTab}
          openModal={openModal}
          closeModal={closeModal}
          dispatch={dispatch}
          configModalTab={configModalTab}
          configTabNonce={configTabNonce}
          openConfigModalWithTab={openConfigModalWithTab}
          openLoginModal={openLoginModal}
          setRefreshUrl={setRefreshUrl}
          selectedCountryContestant={selectedCountryContestant}
          isSorterModalOpen={isSorterModalOpen}
          closeSorterModal={closeSorterModal}
          openSorterModal={openSorterModal}
          getItemsToSort={getItemsToSort}
          authModalOpen={authModalOpen}
          setAuthModalOpen={setAuthModalOpen}
          authModalView={authModalView}
          authModalAllowRegister={authModalAllowRegister}
          quizModalOpen={quizModalOpen}
          setQuizModalOpen={setQuizModalOpen}
          quizCode={quizCode}
          setQuizCode={setQuizCode}
          joinGroupToken={joinGroupToken}
          setJoinGroupToken={setJoinGroupToken}
        />

        {/* <CanvasDevModal
          isOpen={isDevModalOpen}
          onClose={() => setIsDevModalOpen(false)}
        /> */}
      </div>
    </VideoPipProvider>
  );
};

export default App;
