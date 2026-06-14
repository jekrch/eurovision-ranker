import React, { useEffect, useRef } from 'react';

import { reloadRankingsForYear } from '../redux/rankingActions';
import { setActiveCategory, setShowTotalRank, setCategories } from '../redux/rootSlice';
import { AppDispatch, AppState } from '../redux/store';
import { parseCategoriesUrlParam } from '../utilities/CategoryUtil';
import { loadAllCategoryRankingsFromURL } from '../utilities/UrlUtil';

interface UseUrlSyncArgs {
  activeCategory: number | undefined;
  categories: AppState['root']['categories'];
  year: string;
  dispatch: AppDispatch;
  // Armed once the store has been hydrated from the URL on boot, so the single
  // URL writer (useUrlWriter) knows it is safe to start projecting the store
  // back to the URL without clobbering the share link we booted from.
  writerReadyRef: React.MutableRefObject<boolean>;
}

/**
 * Owns App's URL <-> state synchronization effects: seeding every category's
 * ranking into the store on boot, loading categories from the URL, re-resolving
 * rankings on a year change, and the first-load category/total-rank bootstrap.
 *
 * Switching the active category or the Total tab no longer reads the URL — the
 * store holds all per-category rankings and the displayed list is derived via
 * selectActiveRankedItems. The URL is read here only at boot (and on popstate,
 * elsewhere). Public-view-by-id is now plain store state (`viewMode`): the load
 * lives in usePublicRankingView and the exit is a reducer concern, so none of
 * these effects need the old public-view refs.
 */
export function useUrlSync({
  activeCategory,
  categories,
  year,
  dispatch,
  writerReadyRef,
}: UseUrlSyncArgs) {
  // Boot seeds the store (and `year`) from the URL; the year effect below must
  // not re-resolve on that initial population — only on a later user year change.
  const yearResolvedRef = useRef(false);
  /**
   * Boot: seed the store with every category's ranking from the URL. After this
   * the store is self-sufficient, so switching the active category or the Total
   * tab is a pure dispatch with no URL read and no reload — the old
   * reload-on-tab-change effect that lived here is gone.
   */
  useEffect(() => {
    // A `?id=` share link is hydrated by usePublicRankingView (loadPublicRankingById),
    // which arms the URL writer once the shared ranking is loaded. There is no
    // r= to read here, so skip the normal boot read entirely.
    if (new URLSearchParams(window.location.search).has('id')) {
      return;
    }
    // Arm the single URL writer only after the store has been hydrated from the
    // URL — projecting the (empty) store before this resolves would wipe the
    // share link we are booting from.
    loadAllCategoryRankingsFromURL(activeCategory, dispatch).finally(() => {
      writerReadyRef.current = true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Load categories from the url
   */
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const categoriesParam = searchParams.get('c');
    if (categoriesParam) {
      const parsedCategories = parseCategoriesUrlParam(categoriesParam);
      dispatch(setCategories(parsedCategories));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleYearUpdate = async () => {
      if (!year?.length) {
        return;
      }

      // Skip the first non-empty year, which is the value boot just loaded from
      // the URL — re-resolving it would redo work boot already did. (A public-view
      // boot's loaded year is skipped here too; a later user year change has
      // already flipped viewMode to 'normal' via setYear by the time we reload.)
      if (!yearResolvedRef.current) {
        yearResolvedRef.current = true;
        return;
      }

      // User picked a new year: re-resolve every category's ranking against it
      // from the store (no URL read). The single URL writer projects `y` and the
      // refreshed rankings back out.
      await dispatch(reloadRankingsForYear(year));
    };
    handleYearUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  // First-load category bootstrap. The category structure's store slots are
  // reshaped by the category actions (a reducer), not here, and the per-category
  // rankings are projected to the URL by the single writer — this effect only
  // settles which tab is shown when no active category has been chosen yet.
  useEffect(() => {
    if (categories.length > 0) {
      // activeCategory is undefined on first page load: show the total view when
      // there are competing categories, otherwise the sole category's ranking.
      if (activeCategory === undefined) {
        if (categories.length > 1) {
          dispatch(setShowTotalRank(true));
        } else {
          dispatch(setActiveCategory(0));
        }
      }
    } else {
      // with no categories there is nothing to total
      dispatch(setShowTotalRank(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);
}
