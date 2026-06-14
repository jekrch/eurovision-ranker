import { Country } from '../../data/Country';
import { CountryContestant } from '../../data/CountryContestant';
import { convertRankingsStrToArray } from '../UrlUtil';
import { Category } from './types';

export function parseCategoriesUrlParam(categoriesParam: string) {
  return categoriesParam.split('|').map((category) => {
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
 * For each of the provided categories, return the relevant ranked country
 * id array from the category's rx url param
 *
 * @param categories
 * @param searchParams
 * @returns a map of the country name and ranked id array
 */
export function getAllCategoryRankingsFromUrl(
  categories: Category[],
  searchParams: URLSearchParams,
) {
  const categoryRankings: { [key: string]: string[] } = {};

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
export function getCountryCategoryRankingsFromUrl(categories: Category[], country: Country) {
  const params = new URLSearchParams(window.location.search);
  const categoryRankings: { [key: string]: number } = {};

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

/**
 * Returns a map of all of the countries category rankings (category name: rank)
 *
 * @param categories
 * @param countryContestant
 * @returns
 */
export function getContestantCategoryRankingsFromUrl(
  categories: Category[],
  countryContestant: CountryContestant,
) {
  const params = new URLSearchParams(window.location.search);
  const categoryRankings: { [key: string]: number } = {};

  categories.forEach((category, index) => {
    const categoryParam = `r${index + 1}`;
    const ranking = params.get(categoryParam);

    if (ranking) {
      const rankedIds = convertRankingsStrToArray(ranking);
      let categoryRank;

      if (rankedIds?.[0].length === 3) {
        categoryRank = rankedIds.indexOf(countryContestant?.contestant?.id ?? '') + 1;
      } else {
        categoryRank = rankedIds.indexOf(countryContestant.id ?? '') + 1;
      }

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

export const areCategoriesSet = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const rParam = urlParams.get('c');
  return rParam !== null && rParam !== '';
};
