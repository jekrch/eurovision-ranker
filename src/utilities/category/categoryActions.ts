import { saveCategoriesToUrl } from './categoryUrl';
import { Category } from './types';
import {
  setActiveCategory,
  setCategories,
  setShowTotalRank,
  seedCategoryRankingSlots,
  removeCategoryRankingSlot,
  collapseCategoryRankingsToSlot,
} from '../../redux/rootSlice';
import { AppDispatch } from '../../redux/store';

/**
 * Clear all categories: collapse the per-category rankings down to the kept
 * slot's order, which becomes the sole, category-less ranking. The single URL
 * writer projects the collapsed `r` (and drops the now-stale `rN`); the `c`
 * param is removed here.
 *
 * @param keepSlot the category slot whose ranking survives as the main ranking
 * @param dispatch
 */
export function clearCategories(keepSlot: number, dispatch: AppDispatch) {
  dispatch(collapseCategoryRankingsToSlot(keepSlot));

  dispatch(setActiveCategory(undefined));

  // if there are no more categories, make sure that showTotalRank is false
  dispatch(setShowTotalRank(false));

  dispatch(setCategories([]));

  // remove the c param (an empty list deletes it)
  saveCategoriesToUrl([]);
}

export function saveCategories(
  updatedCategories: Category[],
  dispatch: AppDispatch,
  _currentCategories: Category[],
  activeCategory: number | undefined,
) {
  if (updatedCategories.length === 0) {
    // Clearing categories: keep the active ranking (or the first non-empty one)
    // as the single category-less ranking.
    clearCategories(activeCategory ?? 0, dispatch);
  } else {
    dispatch(setCategories(updatedCategories));
    // Ensure a store slot per category; newly added ones inherit the active
    // ranking, matching how defining a category historically started it from the
    // current order.
    dispatch(seedCategoryRankingSlots(updatedCategories.length));
    saveCategoriesToUrl(updatedCategories);
  }
}

/**
 * Delete the category at the provided index, updating the categories, the
 * per-category ranking slots in the store, and the activeCategory as needed. The
 * single URL writer reprojects the remaining `rN` (the deleted slot's param
 * disappears and the rest renumber automatically).
 */
export const deleteCategory = (
  indexToDelete: number,
  dispatch: AppDispatch,
  categories: Category[],
  activeCategory: number | undefined,
) => {
  if (categories?.length === 1) {
    return saveCategories([], dispatch, categories, activeCategory);
  }

  const updatedCategories = [...categories];
  updatedCategories.splice(indexToDelete, 1);

  // Drop the deleted category's ranking slot; remaining slots shift down to stay
  // index-aligned with the categories.
  dispatch(removeCategoryRankingSlot(indexToDelete));

  // Update the activeCategory if necessary
  if (activeCategory === indexToDelete) {
    // deleted the active one — fall back to the first remaining category
    dispatch(setActiveCategory(0));
  } else if (activeCategory !== undefined && activeCategory > indexToDelete) {
    // a category before the active one was removed — shift the index down
    dispatch(setActiveCategory(activeCategory - 1));
  }

  dispatch(setCategories(updatedCategories));
  saveCategoriesToUrl(updatedCategories);
};
