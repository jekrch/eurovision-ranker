import { getAllCategoryRankingsFromUrl } from './categoryUrl';
import { Category } from './types';
import { CountryContestant } from '../../data/CountryContestant';

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
  searchParams?: URLSearchParams | undefined,
): CountryContestant[] {
  // if there are no competing category ranks to aggregate
  // then just return what we have
  if (categories?.length < 2) {
    return rankedItems;
  }

  searchParams = searchParams ?? new URLSearchParams(window.location.search);

  const categoryRankings: { [key: string]: string[] } = getAllCategoryRankingsFromUrl(
    categories,
    searchParams,
  );

  return reorderByWeightedCategoryMap(categories, rankedItems, categoryRankings);
}

/**
 * Reorders the provided pool by the weighted aggregation of per-category orders
 * held in the store, instead of reading them from the URL. This is the engine
 * behind the Total tab under the store-as-source-of-truth model.
 *
 * @param categories category definitions (name + weight), index-aligned with categoryRankings
 * @param categoryRankings each category's ranked contestants, indexed by category
 * @param isGlobalMode whether ids are global 3-char uids
 */
export function reorderByStoreCategoryRankings(
  categories: Category[],
  categoryRankings: CountryContestant[][],
  isGlobalMode: boolean,
): CountryContestant[] {
  // the pool to reorder is any category's membership (all categories share the
  // same contestants, only the order differs)
  const pool = categoryRankings.find((ranking) => ranking.length) ?? [];

  if (categories?.length < 2) {
    return pool;
  }

  const idOf = (item: CountryContestant): string =>
    (isGlobalMode ? item.uid : item.country.id) ?? '';

  const rankingMap: { [key: string]: string[] } = {};
  categories.forEach((category, index) => {
    const ranking = categoryRankings[index];
    if (ranking?.length) {
      rankingMap[category.name] = ranking.map(idOf).filter((id) => id !== '');
    }
  });

  return reorderByWeightedCategoryMap(categories, pool, rankingMap);
}

/**
 * Shared engine: given each category's ranked id list (keyed by category name)
 * and a pool of contestants, produce the weighted total order. Sourcing the id
 * lists (URL vs store) is the caller's concern.
 */
function reorderByWeightedCategoryMap(
  categories: Category[],
  rankedItems: CountryContestant[],
  categoryRankings: { [key: string]: string[] },
): CountryContestant[] {
  // Calculate the weighted scores for each country
  const weightedScores: { [key: string]: number } = calculateTotalRankScoresForWeighedCategories(
    categoryRankings,
    categories,
  );

  // Create an array of objects containing country IDs and their weighted scores
  const countriesWithScores = Object.keys(weightedScores).map((countryId) => ({
    countryId,
    score: weightedScores[countryId],
  }));

  // Sort the countries based on their weighted scores
  countriesWithScores.sort((a, b) => b.score - a.score);

  // Find the most weighted categories
  const maxWeight = Math.max(...categories.map((category) => category.weight));
  const mostWeightedCategories = categories.filter((category) => category.weight === maxWeight);

  // Resolve ties based on the ranking in the most weighted categories
  resolveWeightedCategoryRankingTies(countriesWithScores, mostWeightedCategories, categoryRankings);

  // reorder the rankedItems based on the sorted countriesWithScores. Handle 3 letter global uids
  // differently than the shorter non-global ids
  const reorderedRankedItems = countriesWithScores
    .map(({ countryId }) =>
      rankedItems.find((item) =>
        countryId.length === 3 ? item.uid === countryId : item.country.id === countryId,
      ),
    )
    .filter((item): item is CountryContestant => item !== undefined);

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
  countriesWithScores: { countryId: string; score: number }[],
  mostWeightedCategories: Category[],
  categoryRankings: { [key: string]: string[] },
) {
  let startIndex = 0;

  // Iterate through the countriesWithScores array
  while (startIndex < countriesWithScores.length) {
    let endIndex = startIndex + 1;

    // find the range of tied countries with the same score
    while (
      endIndex < countriesWithScores.length &&
      countriesWithScores[endIndex].score === countriesWithScores[startIndex].score
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
              categoryRanking.indexOf(countryA.countryId) -
              categoryRanking.indexOf(countryB.countryId),
          );

          // Check if the rankings in the current category are unique for the tied countries
          const uniqueRankings = Array.from(
            new Set(tiedCountries.map((country) => categoryRanking.indexOf(country.countryId))),
          );

          // if the rankings are unique, the tie is resolved, so break the loop
          if (uniqueRankings.length === tiedCountries.length) {
            break;
          }
        }
      }

      // replace the tied countries in the original array with the sorted order
      countriesWithScores.splice(startIndex, endIndex - startIndex, ...tiedCountries);
    }

    // move the startIndex to the next untied country
    startIndex = endIndex;
  }
}

function calculateTotalRankScoresForWeighedCategories(
  categoryRankings: { [key: string]: string[] },
  categories: Category[],
) {
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
  return weightedScores;
}

function calculateCountryScores(ranking: string[]): { [key: string]: number } {
  const countryScores: { [key: string]: number } = {};
  ranking.forEach((countryId, index) => {
    countryScores[countryId] = ranking.length - index;
  });
  return countryScores;
}
