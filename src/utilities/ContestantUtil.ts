import { CountryContestant } from "../data/CountryContestant";
import { Category } from "./CategoryUtil";
import { convertRankingsStrToArray, getUrlParam, updateQueryParams } from "./UrlUtil";

export function clone(contestants: CountryContestant[]) {
    return JSON.parse(JSON.stringify(contestants));
}

/**
 * Return string array of all country contestant uids (contestant.id)
 * @param contestants 
 * @returns 
 */
export function getUids(contestants: CountryContestant[]): string[] {
    return contestants.filter(
        f =>
            f.uid && 
            f.uid !== null
    ).map(
        f => f.uid!
    );
}

/**
 * Return the distinct years in the provided rankedItems array
 * 
 * @param rankedItems 
 * @returns 
 */
export const getDistinctRankedYears = (rankedItems: CountryContestant[]): any[] => {
    // map years and filter out undefined values
    const years = rankedItems
      .map(item => item?.contestant?.year)
      .filter((year): any => year !== undefined);
  
    // create a Set to remove duplicates, then convert back to array
    return Array.from(new Set(years));
  };


/**
 * For each category, convert the current URL ranking code to or from global search 
 * mode (ids vs uids) as determined by the globalSearch flag. 
 * 
 * @param categories 
 * @param globalSearch 
 * @param rankedItems 
 */

export function convertRankingUrlParamsByMode(
    categories: Category[], 
    isGlobalSearchMode: boolean, 
    rankedItems: CountryContestant[]
) {
    const params: { [key: string]: string; } = {};

    categories.forEach((_, index) => {

        const categoryParam = `r${index + 1}`;
        let categoryRanking = getUrlParam(categoryParam) || '';

        if (isGlobalSearchMode &&
            !hasGlobalRanking(categoryRanking)) {

            categoryRanking = convertRankingToGlobal(categoryRanking, rankedItems);

        } else if (!isGlobalSearchMode &&
            hasGlobalRanking(categoryRanking)) {
            categoryRanking = convertRankingFromGlobal(categoryRanking, rankedItems);
        }
        params[categoryParam] = categoryRanking;
    });

    updateQueryParams(params);
}

function convertRankingToGlobal(categoryRanking: string, rankedItems: import("c:/projects/eurovision-ranker/src/data/CountryContestant").CountryContestant[]) {
    let newRankIds = [];
    const nonGlobalIds = convertRankingsStrToArray(categoryRanking);

    for (const globalCountryId of nonGlobalIds) {
        const rankedUid = rankedItems.filter(
            i => i.id === globalCountryId
        )?.[0]?.uid;

        if (rankedUid) {
            newRankIds.push(rankedUid);
        }
    }
    categoryRanking = `>${newRankIds.join('')}`;
    return categoryRanking;
}

function convertRankingFromGlobal(categoryRanking: string, rankedItems: import("c:/projects/eurovision-ranker/src/data/CountryContestant").CountryContestant[]) {
    let newRankIds = [];
    const globalUids = convertRankingsStrToArray(categoryRanking);

    for (const globalUid of globalUids) {

        const rankedId = rankedItems.filter(
            i => i.uid === globalUid
        )?.[0]?.id;

        if (rankedId) {
            newRankIds.push(rankedId);
        }
    }
    categoryRanking = `${newRankIds.join('')}`;
    return categoryRanking;
}

function hasGlobalRanking(ranking: string) {
    return ranking?.length > 0 && ranking?.[0] === '>';   
}

