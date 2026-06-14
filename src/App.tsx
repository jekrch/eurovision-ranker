import React, { useCallback, useEffect, useRef, useState } from 'react';

import AppContent from './components/AppContent';
import AppModals from './components/AppModals';
import { useModalController } from './components/modals/ModalControllerContext';
import WelcomeOverlay from './components/modals/WelcomeOverlay';
import { useAppDispatch, useAppSelector } from './hooks/stateHooks';
import { useDeepLinkBoot } from './hooks/useDeepLinkBoot';
import { usePublicRankingView } from './hooks/usePublicRankingView';
import { useRankingDragDrop } from './hooks/useRankingDragDrop';
import { useThemeEffect } from './hooks/useThemeEffect';
import { useUrlSync } from './hooks/useUrlSync';
import { useUrlWriter } from './hooks/useUrlWriter';
import { selectActiveRankedItems } from './redux/rankingSelectors';
import {
  setShowUnranked,
  setActiveCategory,
  setShowTotalRank,
  setGlobalSearch,
  patchUser,
} from './redux/rootSlice';
import { AppDispatch, AppState } from './redux/store';
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
import { urlHasRankings } from './utilities/UrlUtil';

const App: React.FC = () => {
  const { openModal } = useModalController();
  const [refreshUrl, setRefreshUrl] = useState(0);
  // Armed after the boot hydration so the single URL writer (useUrlWriter) only
  // starts projecting the store back to the URL once the store reflects it.
  const writerReadyRef = useRef(false);
  const dispatch: AppDispatch = useAppDispatch();

  const showUnranked = useAppSelector((state: AppState) => state.root.showUnranked);
  const theme = useAppSelector((state: AppState) => state.root.theme);
  const showTotalRank = useAppSelector((state: AppState) => state.root.showTotalRank);
  const rankedItems = useAppSelector(selectActiveRankedItems);
  const unrankedItems = useAppSelector((state: AppState) => state.root.unrankedItems);
  const year = useAppSelector((state: AppState) => state.root.year);
  const globalSearch = useAppSelector((state: AppState) => state.root.globalSearch);
  const categories = useAppSelector((state: AppState) => state.root.categories);
  const activeCategory = useAppSelector((state: AppState) => state.root.activeCategory);

  const [showOverlay, setShowOverlay] = useState(
    !cameFromTour() &&
      !areRankingsSet() &&
      !isAuthDeepLink() &&
      !hasIdParam() &&
      !hasJoinToken() &&
      !hasQuizCode(),
  );
  const [isOverlayExit, setIsOverlayExit] = useState(false);
  useThemeEffect();

  // Public-view-by-id mode: when the URL is just `?id=<ranking_id>` the shared
  // ranking is loaded into the store and `viewMode` is set to 'public', so the
  // single URL writer projects just `?id=`. The first user edit flips `viewMode`
  // back to 'normal' (a reducer concern) and the writer expands the URL.
  const { loadPublicRankingById } = usePublicRankingView({
    activeCategory,
    dispatch,
    writerReadyRef,
  });

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
    // The edit itself is a store dispatch the single URL writer projects; public
    // view (if active) exits via the editing reducer flipping `viewMode`. This
    // only needs to arm the writer for the rare case where the first edit beats
    // boot hydration.
    writerReadyRef.current = true;
  }, [refreshUrl]);

  // boot: handle email-link deep paths, ?signup=beta gate, ?id= shared rankings,
  // and the API reachability probe. Opens the matching modals via the controller.
  useDeepLinkBoot({ loadPublicRankingById });

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
    // The `g` param is projected from the store by the single URL writer
    // (useUrlWriter); just update the store here.
    dispatch(setGlobalSearch(checked));
  };

  // URL <-> state synchronization: seed every category's ranking on boot, load
  // categories from the URL, re-resolve rankings on a year change, and the
  // first-load category/total-rank bootstrap. Declared here because its boot
  // read must run after the deep-link effects above — see useUrlSync.
  useUrlSync({
    activeCategory,
    categories,
    year,
    dispatch,
    writerReadyRef,
  });

  // The single store -> URL writer: projects the store's canonical params to the
  // URL, replacing the scattered updateQueryParams calls. Public view needs no
  // ordering coordination here — it is store state (`viewMode`) the writer reads
  // through selectUrlParams.
  useUrlWriter({ readyRef: writerReadyRef });

  // Drag-and-drop + add-to-ranked handlers, including keeping every category
  // ranking in the URL in sync. Extracted to keep App focused on composition.
  const { handleOnDragEnd, handleAddToRanked } = useRankingDragDrop({
    rankedItems,
    unrankedItems,
    globalSearch,
    dispatch,
    setRefreshUrl,
  });

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

      <AppContent
        theme={theme}
        showUnranked={showUnranked}
        globalSearch={globalSearch}
        showOverlay={showOverlay}
        isOverlayExit={isOverlayExit}
        handleOnDragEnd={handleOnDragEnd}
        handleAddToRanked={handleAddToRanked}
        updateGlobalSearch={updateGlobalSearch}
      />

      <AppModals setRefreshUrl={setRefreshUrl} />
    </div>
  );
};

export default App;
