import { saveCategoriesToUrl } from './categoryUrl';
import { Category } from './types';
import { setActiveCategory, setCategories, setShowTotalRank } from '../../redux/rootSlice';
import { AppDispatch } from '../../redux/store';

/**
 * Clear all categories and category rankings, and then make rankingsToSet
 * the new main ranking
 *
 * @param rankingToSet
 * @param categories
 * @param dispatch
 */
export function clearCategories(
  rankingToSet: string,
  categories: Category[],
  dispatch: AppDispatch,
) {
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set('r', rankingToSet);

  searchParams.delete('c');

  for (let i = 1; i <= categories.length; i++) {
    searchParams.delete(`r${i}`);
  }

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState(null, '', newUrl);

  dispatch(setActiveCategory(undefined));

  // if there are no more categories, make sure that showTotalRank is false
  dispatch(setShowTotalRank(false));

  dispatch(setCategories([]));
}

export function saveCategories(
  updatedCategories: Category[],
  dispatch: AppDispatch,
  currentCategories: Category[],
  activeCategory: number | undefined,
) {
  setCategories(updatedCategories);

  if (updatedCategories.length === 0) {
    // if we're clearing categories, set the currently selected or first
    // available category ranking to r=
    const searchParams = new URLSearchParams(window.location.search);
    let rankingToSet = '';

    if (activeCategory !== undefined) {
      // if there is a currently selected category, use its ranking
      const categoryParam = `r${activeCategory + 1}`;
      rankingToSet = searchParams.get(categoryParam) || '';
    } else {
      // If no active category, use the first available category ranking
      for (let i = 1; i <= currentCategories.length; i++) {
        const categoryParam = `r${i}`;
        const ranking = searchParams.get(categoryParam);
        if (ranking) {
          rankingToSet = ranking;
          break;
        }
      }
    }

    // Set the current ranking to r= and remove all rx params
    clearCategories(rankingToSet, currentCategories, dispatch);
  } else {
    dispatch(setCategories(updatedCategories));
    saveCategoriesToUrl(updatedCategories);
  }
}

/**
 * Delete category with the provided index, updating categories state, url, and
 * the activeCategory state if necessary
 *
 * @param indexToDelete
 * @param dispatch
 * @param categories
 * @param activeCategory
 * @returns
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

  const searchParams = new URLSearchParams(window.location.search);

  // Remove the corresponding rx URL param
  const categoryParam = `r${indexToDelete + 1}`;
  const ranking = searchParams.get(categoryParam);
  searchParams.delete(categoryParam);

  if (updatedCategories.length === 0) {
    // If no categories left, convert the current rx param to an r param
    if (ranking) {
      searchParams.set('r', ranking);
    }
  } else {
    // Renumber the remaining rx URL params to ensure they are sequential
    for (let i = indexToDelete + 1; i < categories.length; i++) {
      const oldCategoryParam = `r${i + 1}`;
      const newCategoryParam = `r${i}`;
      const ranking = searchParams.get(oldCategoryParam);
      if (ranking) {
        searchParams.set(newCategoryParam, ranking);
        searchParams.delete(oldCategoryParam);
      }
    }
  }

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState(null, '', newUrl);

  // Update the activeCategory if necessary
  if (activeCategory === indexToDelete) {
    if (updatedCategories.length > 0) {
      dispatch(setActiveCategory(0)); // Set to the next available index
    } else {
      dispatch(setActiveCategory(undefined)); // Set to undefined if no categories left
    }
  } else if (activeCategory !== undefined && activeCategory > indexToDelete) {
    dispatch(setActiveCategory(activeCategory - 1)); // Adjust the activeCategory to match the renumbered category
  }

  saveCategories(updatedCategories, dispatch, categories, activeCategory);
};
