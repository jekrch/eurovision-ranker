import { CountryContestant } from '../data/CountryContestant';

export function clone(contestants: CountryContestant[]) {
  return JSON.parse(JSON.stringify(contestants));
}

/**
 * Return string array of all country contestant uids (contestant.id)
 * @param contestants
 * @returns
 */
export function getUids(contestants: CountryContestant[]): string[] {
  return contestants.filter((f) => f.uid && f.uid !== null).map((f) => f.uid!);
}

/**
 * Return the distinct years in the provided rankedItems array
 *
 * @param rankedItems
 * @returns
 */
export const getDistinctRankedYears = (rankedItems: CountryContestant[]): string[] => {
  // map years and filter out undefined values
  const years = rankedItems
    .map((item) => item?.contestant?.year)
    .filter((year): year is string => year !== undefined);

  // create a Set to remove duplicates, then convert back to array
  return Array.from(new Set(years));
};

