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

    var { list1, list2 } = alignListSize(list1Code, list2Code);

    const listSize = list1.length;

    let rankingComparison: RankingComparison = initRankingComparison(
        list1Code, list2Code, year, list1, contestants
    );

    let totalScore = 0;

    let biggestDifferences: RankingDifference[] = [];
    let smallestDifferences: RankingDifference[] = [];

    // score all contestants in list 1 
    list1.forEach((contestant) => {
        totalScore = processRankComparisonForContestant(
            contestant,
            list1,
            list2,
            totalScore,
            biggestDifferences,
            smallestDifferences
        );
    });

    // score all contestants in list 2 which were not in 1 
    list2.forEach((contestant) => {
        if (!list1.includes(contestant)) {
            totalScore = processRankComparisonForContestant(
                contestant,
                list1,
                list2,
                totalScore,
                biggestDifferences,
                smallestDifferences
            );
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

    return rankingComparison;
}

/**
 * If one list is larger than the other, truncate the larger list, removing 
 * the lowest ranked members until they're equally sized. 
 * 
 * @param list1Code 
 * @param list2Code 
 * @returns 
 */
function alignListSize(list1Code: string, list2Code: string) {

    let list1 = convertRankingsStrToArray(list1Code);
    let list2 = convertRankingsStrToArray(list2Code);

    const listSize = Math.min(list1.length, list2.length);

    list1 = list1.slice(0, listSize);
    list2 = list2.slice(0, listSize);

    return { list1, list2 };
}

/**
 * Calculate the similarity between the ranking of the provided contestant in each list. 
 * Add the similarity score to the total score and update the biggest/smallest differences 
 * arrays as needed 
 * 
 * @param contestant 
 * @param list1 
 * @param list2 
 * @param totalScore 
 * @param biggestDifferences 
 * @param smallestDifferences 
 * @returns 
 */
function processRankComparisonForContestant(
    contestant: string,
    list1: string[],
    list2: string[],
    totalScore: number,
    biggestDifferences: RankingDifference[],
    smallestDifferences: RankingDifference[]
): number {
    const listSize = list1.length;

    const indexInList1 = list1.indexOf(contestant);
    const indexInList2 = list2.indexOf(contestant);

    const isContestantInList1 = indexInList1 !== -1;
    const isContestantInList2 = indexInList2 !== -1;

    let similarityScore = calculateSimilarityScore(
        indexInList1,
        indexInList2, 
        listSize
    );

    //console.log(` -- ${indexInList1} vs ${indexInList2}` );
    //console.log(similarityScore + ` > ${songScore1} vs ${songScore2}` );

    totalScore += similarityScore;

    let rankDifference = Math.abs(
        (isContestantInList1 ? indexInList1 : list1.length) -
        (isContestantInList2 ? indexInList2 : list2.length)
    );

    //console.log(rankDifference);

    let newDifference: RankingDifference = {
        id: contestant,
        difference: rankDifference,
        rankInList1: isContestantInList1 ? indexInList1 + 1 : list1.length + 1,
        rankInList2: isContestantInList2 ? indexInList2 + 1 : list2.length + 1
    };

    updateRankingDifferences(biggestDifferences, newDifference, true);
    updateRankingDifferences(smallestDifferences, newDifference, false);

    return totalScore;
}

function calculateSimilarityScore(
    indexInList1: number,
    indexInList2: number,
    listSize: number
) {

    if (indexInList1 == -1 || indexInList1 == -2) {
        return 0;
    }

    let songScore1 = getSongScore(indexInList1, listSize);
    let songScore2 = getSongScore(indexInList2, listSize);

    return 1 - Math.abs(songScore1 - songScore2);
}

function initRankingComparison(
    list1Code: string, list2Code: string,
    year: string, list1: string[],
    contestants: CountryContestant[]
) {

    let rankingComparison: RankingComparison = {} as RankingComparison;
    rankingComparison.list1Code = list1Code;
    rankingComparison.list2Code = list2Code;
    rankingComparison.year = year;

    rankingComparison.filteredList1 = getRankedContestants(list1, contestants);
    return rankingComparison;
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

/**
 * Determines the song score based on its index within a list 
 * of the provided size. 
 * 
 * @param indexInList 
 * @param listSize 
 * @returns 
 */
function getSongScore(indexInList: number, listSize: number) {
    if (indexInList == -1) {
        return 1;
    }
    const initMaxSongScore = (100 / listSize) / 100;
    return Math.abs(initMaxSongScore - ((indexInList + 1) / listSize));
}

/**
 * Return the CountryContestants from contestants which match 
 * the provided idList
 * 
 * @param idList 
 * @param contestants 
 * @returns 
 */
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