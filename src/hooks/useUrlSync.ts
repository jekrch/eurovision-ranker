import React, { useEffect } from 'react';

import { CountryContestant } from '../data/CountryContestant';
import { setActiveCategory, setShowTotalRank, setCategories } from '../redux/rootSlice';
import { AppDispatch, AppState } from '../redux/store';
import { parseCategoriesUrlParam } from '../utilities/CategoryUtil';
import {
  loadAllCategoryRankingsFromURL,
  encodeRankingsToURL,
  updateQueryParams,
} from '../utilities/UrlUtil';

interface UseUrlSyncArgs {
  activeCategory: number | undefined;
  categories: AppState['root']['categories'];
  year: string;
  name: string;
  rankedItems: CountryContestant[];
  dispatch: AppDispatch;
  // public-view-by-id refs/action (owned by usePublicRankingView). While public
  // view is active we suppress the n/y URL writes and redundant reloads.
  publicViewActiveRef: React.MutableRefObject<boolean>;
  publicViewLoadedRef: React.MutableRefObject<boolean>;
  loadedNameRef: React.MutableRefObject<string>;
  loadedYearRef: React.MutableRefObject<string>;
  exitPublicView: () => void;
}

/**
 * Owns App's URL <-> state synchronization effects: seeding every category's
 * ranking into the store on boot, loading categories from the URL, keeping the
 * per-category `rx` params (and `y`/`n`) written, and the first-load
 * category/total-rank bootstrapping.
 *
 * Switching the active category or the Total tab no longer reads the URL — the
 * store holds all per-category rankings and the displayed list is derived via
 * selectActiveRankedItems. The URL is read here only at boot (and on popstate,
 * elsewhere).
 */
export function useUrlSync({
  activeCategory,
  categories,
  year,
  name,
  rankedItems,
  dispatch,
  publicViewActiveRef,
  publicViewLoadedRef,
  loadedNameRef,
  loadedYearRef,
  exitPublicView,
}: UseUrlSyncArgs) {
  /**
   * Boot: seed the store with every category's ranking from the URL. After this
   * the store is self-sufficient, so switching the active category or the Total
   * tab is a pure dispatch with no URL read and no reload — the old
   * reload-on-tab-change effect that lived here is gone.
   */
  useEffect(() => {
    // Public-view-by-id loads its ranking directly; the URL has no r= to read.
    if (publicViewActiveRef.current) return;
    loadAllCategoryRankingsFromURL(activeCategory, dispatch);
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

      await loadAllCategoryRankingsFromURL(activeCategory, dispatch);
    };
    handleYearUpdate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year]);

  useEffect(() => {
    if (publicViewActiveRef.current) {
      if (!publicViewLoadedRef.current) return;
      if (name === loadedNameRef.current) return;
      exitPublicView();
    }
    updateQueryParams({ n: name });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // If active category is undefined, then this is the
      // first page load. In that case either
      // 1. if there are more than 1 categories, show the total view
      // or
      // 2. if there is only 1 category, just show that category ranking
      if (activeCategory === undefined) {
        if (categories?.length > 1) {
          dispatch(setShowTotalRank(true));
        } else {
          dispatch(setActiveCategory(0));
        }
      }
    } else {
      // if there are no categories, make sure showTotalRank is false
      dispatch(setShowTotalRank(false));
    }

    // Re-seed every category's store slot from the URL after a category
    // structure change (add / delete / clear) so the store stays the source of
    // truth for tab switching. The category actions have already written the
    // canonical rx params synchronously above; this just mirrors them back in.
    // Skipped in public-view mode, whose ranking is loaded by id, not the URL.
    if (!publicViewActiveRef.current) {
      loadAllCategoryRankingsFromURL(activeCategory, dispatch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);
}
