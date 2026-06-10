import React, { useEffect } from 'react';
import { CountryContestant } from '../data/CountryContestant';
import { AppDispatch, AppState } from '../redux/store';
import { setRankedItems, setActiveCategory, setShowTotalRank, setCategories } from '../redux/rootSlice';
import { loadRankingsFromURL, encodeRankingsToURL, updateQueryParams } from '../utilities/UrlUtil';
import { parseCategoriesUrlParam, reorderByAllWeightedRankings } from '../utilities/CategoryUtil';
import { isArrayEqual } from '../utilities/RankAnalyzer';

interface UseUrlSyncArgs {
  activeCategory: number | undefined;
  showTotalRank: boolean;
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
 * Owns App's URL <-> state synchronization effects: reloading rankings when the
 * active category / total-rank tab changes, loading categories from the URL,
 * keeping the per-category `rx` params (and `y`/`n`) written, and the
 * first-load category/total-rank bootstrapping.
 *
 * IMPORTANT: these effects are ordering-sensitive. React runs effects in
 * declaration order, so this hook must be called at the same position App
 * previously declared this block (after the boot/deep-link effects), and the
 * effects below must stay in this exact order. Behavior must match the original
 * in-component effects 1:1.
 */
export function useUrlSync({
  activeCategory,
  showTotalRank,
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
}
