import toast from "react-hot-toast";
import { convertRankingsStrToArray, updateQueryParams } from "./UrlUtil";
import { CountryContestant } from "../data/CountryContestant";
import { Dispatch } from "react";
import { setRankedItems } from "../redux/actions";

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
export function isValidCategoryName(newCategoryName: string) {
    if (newCategoryName.includes('|')) {
        toast.error('Category names cannot contain "|"');
        return false;
    }
    if (newCategoryName.trim().toLowerCase() == 'total') {
        toast.error('"Total" cannot be used as a category name');
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
export function reorderByAllWeightedRankings(
    categories: Category[],
    rankedItems: CountryContestant[], 
  ): CountryContestant[] {
    
    // if there are no competing category ranks to aggregate
    // then just return what we have
    if (categories?.length < 2) {
      return rankedItems;
    }
  
    const searchParams = new URLSearchParams(window.location.search);
    const categoryRankings: { [key: string]: string[] } = {};
  
    // Fetch each category ranking from the URL
    categories.forEach((category, index) => {
      const ranking = getCategoryRankingFromUrl(index, searchParams);
  
      if (ranking) {
        categoryRankings[category.name] = convertRankingsStrToArray(ranking);
      }
    });
  
    // Calculate the weighted scores for each country
    const weightedScores: { [key: string]: number } = {};
  
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
  
    // Sort the countries based on their weighted scores
    const sortedCountries = Object.keys(weightedScores).sort(
      (a, b) => weightedScores[b] - weightedScores[a]
    );
  
    // Reorder the rankedItems based on the weighted ranking
    const reorderedRankedItems = sortedCountries.map((countryId) =>
      rankedItems.find((item) => item.country.id === countryId)
    ).filter((item): item is CountryContestant => item !== undefined);
  
    console.log(weightedScores);
    return reorderedRankedItems;
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