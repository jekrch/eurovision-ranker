import toast from "react-hot-toast";
import { convertRankingsStrToArray, updateQueryParams } from "./UrlUtil";
import { CountryContestant } from "../data/CountryContestant";
import { Dispatch } from "react";
import { setActiveCategory, setCategories, setRankedItems, setShowTotalRank } from "../redux/actions";
import { Country } from "../data/Country";

export type Category = {
  name: string;
  weight: number;
}

/**
    * Determines whether the provided category name is valid.
    * If not, a toast alert is displayed
    * 
    * @param name 
    * @returns 
    */
export function isValidCategoryName(
  newCategoryName: string, 
  categories: Category[]
) {
  if (newCategoryName.includes('|')) {
    toast.error('Category names cannot contain "|"');
    return false;
  }
  if (newCategoryName.trim().toLowerCase() == 'total') {
    toast.error('"Total" cannot be used as a category name');
    return false;
  }
  if (
    categories.some(
      (c: Category) =>
        newCategoryName.toLowerCase().trim() === 
        c.name.toLowerCase().trim())
  ) {
    toast.error(`"${newCategoryName}" is already taken`);
    return false;
  }
  return true;
}

export function saveCategoriesToUrl(updatedCategories: Category[]) {
  const categoriesParam = updatedCategories.map(
    category => `${category.name}-${category.weight}`
  ).join('|');
  updateQueryParams({ c: categoriesParam });
}

/**
 * Remove the provided countryId from all category rankings 
 * 
 * @param categories 
 * @param countryIdToRemove 
 */
export function removeCountryFromUrlCategoryRankings(
  categories: Category[], 
  countryIdToRemove: string
) {
  const searchParams = new URLSearchParams(window.location.search);
  categories.forEach((_, index) => {
    const categoryParam = `r${index + 1}`;
    const currentRanking = searchParams.get(categoryParam);
    if (currentRanking) {
      const rankingArray = convertRankingsStrToArray(currentRanking);
      const updatedRankingArray = rankingArray.filter(countryId => countryId !== countryIdToRemove);
      const updatedRanking = updatedRankingArray.join('');
      if (updatedRanking) {
        searchParams.set(categoryParam, updatedRanking);
      } else {
        searchParams.delete(categoryParam);
      }
    }
  });

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState(null, '', newUrl);
}

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
  dispatch: Dispatch<any>
) {
    
  const searchParams = new URLSearchParams(window.location.search);
  searchParams.set('r', rankingToSet);

  searchParams.delete('c');

  for (let i = 1; i <= categories.length; i++) {
      searchParams.delete(`r${i}`);
  }

  const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
  window.history.replaceState(null, '', newUrl);

  dispatch(
    setActiveCategory(undefined)
  );

  // if there are no more categories, make sure that showTotalRank is false 
  dispatch(
      setShowTotalRank(false)
  );

  dispatch(
    setCategories([])
  );
}

export function parseCategoriesUrlParam(categoriesParam: string) {
  return categoriesParam.split('|').map(category => {
    const lastDashIndex = category.lastIndexOf('-');
    const name = category.slice(0, lastDashIndex);
    const weight = parseInt(category.slice(lastDashIndex + 1), 10);
    return { name, weight };
  });
}

/**
 * returns whether any category rankings exist in the url 
 * 
 * @param urlParams 
 * @returns 
 */
export function categoryRankingsExist(urlParams?: URLSearchParams) {

  urlParams = urlParams ?? new URLSearchParams(window.location.search);

  // check for the presence of categories in the c parameter
  const cParam = urlParams.get('c');
  if (cParam !== null && cParam !== '') {
    const categories = cParam.split(',');
    for (let i = 1; i <= categories.length; i++) {
      const categoryParam = `r${i}`;
      const categoryRanking = urlParams.get(categoryParam);
      if (categoryRanking !== null && categoryRanking !== '') {
        return true;
      }
    }
  }

  return false;
}

/**
 * Reorders the provided rankedList according to the rankings for all provided categories. 
 * Each country is given a score based on its category rankings and weighted by each category 
 * weight. These scores determine the final ranking (reflected in the rankedItems order). 
 * 
 * Ties where two or more countries have the same score are settled by the country ranking in the 
 * most highly weighted category (and/or the category which comes earliest in the categories 
 * array when there is no single highest weighted category). 
 * 
 * @param categories 
 * @param rankedItems 
 * @returns 
 */
export function reorderByAllWeightedRankings(
  categories: Category[],
  rankedItems: CountryContestant[],
  searchParams?: URLSearchParams | undefined
): CountryContestant[] {

  // if there are no competing category ranks to aggregate
  // then just return what we have
  if (categories?.length < 2) {
    return rankedItems;
  }

  searchParams = searchParams ?? new URLSearchParams(window.location.search);
  
  const categoryRankings: { [key: string]: string[]; } = getAllCategoryRankingsFromUrl(categories, searchParams);

  // Calculate the weighted scores for each country
  const weightedScores: { [key: string]: number; } = calculateTotalRankScoresForWeighedCategories(
    categoryRankings, categories
  );


  // Create an array of objects containing country IDs and their weighted scores
  const countriesWithScores = Object.keys(weightedScores).map(countryId => ({
    countryId,
    score: weightedScores[countryId],
  }));

  // Sort the countries based on their weighted scores
  countriesWithScores.sort((a, b) => b.score - a.score);

  // Find the most weighted categories
  const maxWeight = Math.max(...categories.map(category => category.weight));
  const mostWeightedCategories = categories.filter(category => category.weight === maxWeight);

  // Resolve ties based on the ranking in the most weighted categories
  resolveWeightedCategoryRankingTies(
    countriesWithScores, 
    mostWeightedCategories, 
    categoryRankings
  );

  // Reorder the rankedItems based on the sorted countriesWithScores
  const reorderedRankedItems = countriesWithScores.map(({ countryId }) =>
    rankedItems.find((item) => item.country.id === countryId)
  ).filter((item): item is CountryContestant => item !== undefined);

  return reorderedRankedItems;
}

/**
 * Identifies ties in the provided countriesWithScores array and determines 
 * how to break these ties according to how the affected countries rank in the 
 * most highly weighted category. 
 * 
 * If there is no single most highly ranked category, the category in that 
 * maximally weighted group that comes earliest in the category array is the 
 * category that is used to break ties.
 * 
 * @param countriesWithScores 
 * @param mostWeightedCategories 
 * @param categoryRankings 
 */
function resolveWeightedCategoryRankingTies(
  countriesWithScores: { countryId: string; score: number; }[],
  mostWeightedCategories: Category[],
  categoryRankings: { [key: string]: string[]; }
) {
  let startIndex = 0;

  // Iterate through the countriesWithScores array
  while (startIndex < countriesWithScores.length) {
    let endIndex = startIndex + 1;

    // find the range of tied countries with the same score
    while (
      endIndex < countriesWithScores.length &&
      countriesWithScores[endIndex].score === 
      countriesWithScores[startIndex].score
    ) {
      endIndex++;
    }

    // check if there are tied countries
    if (endIndex - startIndex > 1) {
      const tiedCountries = countriesWithScores.slice(startIndex, endIndex);

      // Iterate through the most weighted categories to resolve ties
      for (const category of mostWeightedCategories) {

        const categoryRanking = categoryRankings[category.name];

        if (categoryRanking) {
          
          // Sort the tied countries based on their ranking in the current category
          tiedCountries.sort(
            (countryA, countryB) =>
              categoryRanking.indexOf(countryA.countryId) - categoryRanking.indexOf(countryB.countryId)
          );

          // Check if the rankings in the current category are unique for the tied countries
          const uniqueRankings = Array.from(
            new Set(tiedCountries.map(country => categoryRanking.indexOf(country.countryId)))
          );

          // if the rankings are unique, the tie is resolved, so break the loop
          if (uniqueRankings.length === tiedCountries.length) {
            break;
          }
        }
      }

      // replace the tied countries in the original array with the sorted order
      countriesWithScores.splice(
        startIndex, endIndex - startIndex, ...tiedCountries
      );
    }

    // move the startIndex to the next untied country
    startIndex = endIndex;
  }
}

function calculateTotalRankScoresForWeighedCategories(
  categoryRankings: { [key: string]: string[]; },
  categories: Category[]
) {
  const weightedScores: { [key: string]: number; } = {};

  Object.entries(categoryRankings).forEach(([categoryName, ranking]) => {

    const category = categories.find((cat) => cat.name === categoryName);

    if (category) {
      const weight = category.weight;
      const countryScores = calculateCountryScores(ranking);

      Object.entries(countryScores).forEach(([countryId, score]) => {
        if (!weightedScores[countryId]) {
          weightedScores[countryId] = 0;
        }
        weightedScores[countryId] += score * weight;
      });
    }
  });
  return weightedScores;
}

/**
 * For each of the provided categories, return the relevant ranked country 
 * id array from the category's rx url param
 * 
 * @param categories 
 * @param searchParams 
 * @returns a map of the country name and ranked id array 
 */
function getAllCategoryRankingsFromUrl(
  categories: Category[],
  searchParams: URLSearchParams
) {
  const categoryRankings: { [key: string]: string[]; } = {};

  // Fetch each category ranking from the URL
  categories.forEach((category, index) => {
    const ranking = getCategoryRankingFromUrl(index, searchParams);

    if (ranking) {
      categoryRankings[category.name] = convertRankingsStrToArray(ranking);
    }
  });
  return categoryRankings;
}

/**
 * Returns a map of all of the countries category rankings (category name: rank)
 * 
 * @param categories 
 * @param country 
 * @returns 
 */
export function getCountryCategoryRankingsFromUrl(
  categories: Category[],
  country: Country
) {
  const params = new URLSearchParams(window.location.search);
  const categoryRankings: { [key: string]: number; } = {};

  categories.forEach((category, index) => {

    const categoryParam = `r${index + 1}`;
    const ranking = params.get(categoryParam);

    if (ranking) {
      const rankedIds = convertRankingsStrToArray(ranking);
      const categoryRank = rankedIds.indexOf(country.id) + 1;
      categoryRankings[category.name] = categoryRank;
    }
  });

  return categoryRankings;
}

function getCategoryRankingFromUrl(index: number, searchParams: URLSearchParams) {
  const categoryParam = `r${index + 1}`;
  const ranking = searchParams.get(categoryParam);
  return ranking;
}

function calculateCountryScores(ranking: string[]): { [key: string]: number } {
  const countryScores: { [key: string]: number } = {};
  ranking.forEach((countryId, index) => {
    countryScores[countryId] = ranking.length - index;
  });
  return countryScores;
}

export const areCategoriesSet = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const rParam = urlParams.get('c');
  return rParam !== null && rParam !== '';
};


export function saveCategories(
  updatedCategories: Category[],
  dispatch: Dispatch<any>,
  currentCategories: Category[],
  activeCategory: number | undefined
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
      clearCategories(
          rankingToSet,
          currentCategories, 
          dispatch
      );

  } else {
      dispatch(
          setCategories(updatedCategories)
      )
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
  dispatch: Dispatch<any>, 
  categories: Category[], 
  activeCategory: number | undefined
) => {
        
  if (categories?.length == 1) {
      return saveCategories(
          [], dispatch, categories, activeCategory
      );
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

  saveCategories(
      updatedCategories, dispatch, categories, activeCategory
  );
};