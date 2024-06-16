import { CountryContestant } from "../data/CountryContestant";
import { fetchCountryContestantsByYear } from "./ContestantRepository";
import { convertRankingsStrToArray } from "./UrlUtil";

export type RankingComparison = {
    year: string;
    list1Code: string;
    list2Code: string;
    percentSimilarity: number;
    filteredList1: CountryContestant[];
    mostSimilarRankings: CountryComparison[];
    mostDifferentRankings: CountryComparison[];
};

interface RankingDifference {
    id: string;
    difference: number;
    rankInList1: number;
    rankInList2: number;
}

export class CountryComparison {
    countryContestant: CountryContestant;
    list1Rank: number;
    list2Rank: number;

    constructor(
        countryContestant: CountryContestant, 
        list1Rank: number, 
        list2Rank: number
    ) {
        this.countryContestant = countryContestant;
        this.list1Rank = list1Rank;
        this.list2Rank = list2Rank;
    }
};

/**
 * Identifies the code from list2Codes that is most similar to the list1code. If there 
 * are ties, all of the tied list2Codes are returned
 * 
 * @param year 
 * @param list1Code 
 * @param list2Codes 
 * @returns 
 */
export async function findMostSimilarLists(
    year: string,
    list1Code: string,
    list2Codes: string[]
): Promise<RankingComparison[]> {

    const comparisons: RankingComparison[] = await Promise.all(
        list2Codes.map(
            list2Code => getRankingComparison(
                year, list1Code, list2Code
            )
        )
    );

    const maxSimilarity = Math.max(
            ...comparisons
                .filter(c => !isNaN(c.percentSimilarity))
                .map(c => c.percentSimilarity)
        );


    return comparisons
        .filter(c => c.percentSimilarity === maxSimilarity);
}

/**
 * Identifies the code from list2Codes that is least similar to the list1code. If there 
 * are ties, all of the tied list2Codes are returned
 * 
 * @param year 
 * @param list1Code 
 * @param list2Codes 
 * @returns 
 */
export async function findLeastSimilarLists(
    year: string,
    list1Code: string,
    list2Codes: string[]
): Promise<RankingComparison[]> {
    const comparisons: RankingComparison[] = await Promise.all(
        list2Codes.map(
            list2Code => getRankingComparison(
                year, list1Code, list2Code
            )
        )
    );

    const maxSimilarity = Math.max(...comparisons.map(c => c.percentSimilarity));

    return comparisons
        .filter(c => c.percentSimilarity === maxSimilarity);
}

export async function getRankingComparison(
    year: string,
    list1Code: string,
    list2Code: string
): Promise<RankingComparison> {

    let contestants: CountryContestant[] = await fetchCountryContestantsByYear(year);

    let rankingComparison: RankingComparison = {} as RankingComparison;
    rankingComparison.list1Code = list1Code;
    rankingComparison.list2Code = list2Code;
    rankingComparison.year = year;

    let { list1, list2 } = getIntersectedLists(list1Code, list2Code);
    rankingComparison.filteredList1 = getRankedContestants(list1, contestants);

    const listSize = list1.length;
    let totalScore = 0;

    let biggestDifferences: RankingDifference[] = [];
    let smallestDifferences: RankingDifference[] = [];

    list1.forEach((item, indexInList1) => {
        const indexInList2 = list2.indexOf(item);
        if (indexInList2 !== -1) {
            let songScore1 = getSongScore(indexInList1, listSize);
            let songScore2 = getSongScore(indexInList2, listSize);
            let similarityScore = (1 - Math.abs(songScore1 - songScore2));
            totalScore += similarityScore;

            let rankDifference = Math.abs(indexInList1 - indexInList2);
            let newDifference: RankingDifference = { 
                id: item, 
                difference: rankDifference, 
                rankInList1: indexInList1 + 1,
                rankInList2: indexInList2 + 1
            };

            updateRankingDifferences(biggestDifferences, newDifference, true);
            updateRankingDifferences(smallestDifferences, newDifference, false);
        }
    });

    rankingComparison.mostDifferentRankings = convertDiffToCountryComparison(
        biggestDifferences, contestants
    );

    rankingComparison.mostSimilarRankings = convertDiffToCountryComparison(
        smallestDifferences, contestants
    );

    // the max score is equal to the list size because each individual 
    // song comparison has a max score of 1
    rankingComparison.percentSimilarity = (totalScore / listSize) * 100;

    return rankingComparison
}

function convertDiffToCountryComparison(smallestDifferences: RankingDifference[], contestants: CountryContestant[]) {
    return smallestDifferences.map(
        i => {
            let countryContestant: CountryContestant = getContestantById(contestants, i.id)!;
            return new CountryComparison(
                countryContestant,
                i.rankInList1,
                i.rankInList2
            );
        }
    );
}

function getIntersectedLists(list1Code: string, list2Code: string) {
    let list1 = convertRankingsStrToArray(list1Code);
    let list2 = convertRankingsStrToArray(list2Code);

    // remove all items that are not in both lists
    list1 = list1.filter(item => list2.includes(item));
    list2 = list2.filter(item => list1.includes(item));
    return { list1, list2 };
}

function getSongScore(indexInList: number, listSize: number) {
    const initMaxSongScore = (100 / listSize) / 100;
    return initMaxSongScore - ((indexInList + 1) / listSize);
}

function getRankedContestants(
    idList: string[],
    contestants: CountryContestant[]
): CountryContestant[] {
    return idList.map(
        id => getContestantById(contestants, id)
    ).filter(
        contestant => contestant !== undefined
    ) as CountryContestant[];
}

function getContestantById(
    contestants: CountryContestant[], id: string
): CountryContestant | undefined {

    return contestants.find(
        contestant => contestant.id === id
    );
}

/**
 * Determine whether to replace any of the rankingDiffs with the newDifference, based 
 * on whether we're measuring the biggestDifference or leastDifference 
 * 
 * @param rankingDifferences 
 * @param newDifference 
 * @param isBiggestDiff 
 */
function updateRankingDifferences(
    rankingDifferences: RankingDifference[],
    newDifference: RankingDifference,
    isBiggestDiff: boolean
) {
    const shouldReplace = (existingDiff: RankingDifference) => 
        isBiggestDiff ? 
            newDifference.difference > existingDiff.difference || 
            (
                newDifference.difference === existingDiff.difference && 
                newDifference.rankInList1 > existingDiff.rankInList1
            ) :
            newDifference.difference < existingDiff.difference || 
            (   
                newDifference.difference === existingDiff.difference && 
                newDifference.rankInList1 < existingDiff.rankInList1
            );

    // find indexes that qualify for replacement
    const replaceableIndexes = rankingDifferences
        .map((diff, index) => ({ index, replace: shouldReplace(diff) }))
        .filter(item => item.replace)
        .map(item => item.index);


    let replaceIndex = -1;
    if (replaceableIndexes.length > 0) {
        // determine the most relevant index to replace
        replaceIndex = isBiggestDiff ? 
            replaceableIndexes.reduce((a, b) => rankingDifferences[a].difference < rankingDifferences[b].difference ? a : b) :
            replaceableIndexes.reduce((a, b) => rankingDifferences[a].difference > rankingDifferences[b].difference ? a : b);
    }

    if (replaceIndex !== -1) {
        rankingDifferences[replaceIndex] = newDifference;
    } else if (rankingDifferences.length < 2) {
        rankingDifferences.push(newDifference);
    }

    rankingDifferences.sort((a, b) => 
        isBiggestDiff ? 
            b.difference - a.difference : 
            a.difference - b.difference
    );
}

export function isArrayEqual(arr1: any[], arr2: any[]): boolean {
    if (arr1.length !== arr2.length) {
      return false;
    }
  
    for (let i = 0; i < arr1.length; i++) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
  
    return true;
  }