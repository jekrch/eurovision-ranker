import { sanitizeYear } from "../data/Contestants";
import { CountryContestant } from '../data/CountryContestant';
import { ContestantVotes, Vote } from "../data/Vote";
import { clone, getUids } from "./ContestantUtil";
import { fetchVotesForYear, fetchVotesForYearsAndCountries } from "./VoteRepository";
import { assignVotes } from "./VoteUtil";

let cachedVoteYear: string;
let cachedVoteRound: string;
let cachedVotes: Vote[];

/**
 * Fetches voting records for the provided params. If these were just previously 
 * fetched for the same year and round, use a cached list. This improves performance 
 * in cases where we need to fetch votes for many countries (see RankAnalyzer)
 * 
 * @param year 
 * @param fromCountryKey 
 * @param round 
 * @returns 
 */
export async function getVotes(
    year: string,
    fromCountryKey: string | undefined,
    round: string
): Promise<Vote[]> {

    if (
        cachedVoteRound !== round ||
        cachedVoteYear !== year
    ) {
        cachedVotes = await fetchVotesForYear(
            year, undefined, round
        );
        cachedVoteRound = round;
        cachedVoteYear = year;
        //console.log('caching')
    }

    return cachedVotes.filter(v =>
        !fromCountryKey ||
        v.fromCountryKey == fromCountryKey
    );
}

export async function sortByVotes(
    countryContestants: CountryContestant[],
    voteType: string,
    round: string = 'final',
    fromCountryKey?: string
): Promise<CountryContestant[]> {
    const voteTypeFieldName: string = getVoteTypeFieldName(voteType);

    // Ensure round is a valid round name, not a vote type
    const validRound = convertToValidRound(round);

    // get unique years from countryContestants, excluding those without a contestant or year
    const years = new Set(countryContestants
        .filter(cc => cc.contestant?.year)
        .map(cc => cc.contestant!.year));

    let votes: Vote[];

    if (years.size > 1) {
        // use the new method for multiple years
        const yearCountryPairs = countryContestants
            .filter(cc => cc.contestant?.year)
            .map(cc => ({
                year: cc.contestant!.year!,
                countryKey: cc.country.key
            }));

        votes = await fetchVotesForYearsAndCountries(yearCountryPairs, validRound);

        if (fromCountryKey) {
            votes = votes.filter(v => v.fromCountryKey === fromCountryKey);
        }
    } else {
        // use the existing method for a single year
        const year = years.size === 1 ? sanitizeYear(Array.from(years)[0]!) : '';
        votes = await getVotes(year, fromCountryKey, validRound);
    }

    const votedContestants = assignVotes(countryContestants, votes);

    // sorting country contestants by votes in descending order
    votedContestants.sort(
        (a, b) => (getContestantVoteFieldValue(b.contestant?.votes, voteTypeFieldName)) -
            (getContestantVoteFieldValue(a.contestant?.votes, voteTypeFieldName))
    );

    // if there is a source country, filter out 0 votes, otherwise, keep them
    if (fromCountryKey?.length) {
        return votedContestants.filter(
            v => getContestantVoteFieldValue(v.contestant?.votes, voteTypeFieldName) > 0
        );
    } else {
        return votedContestants;
    }
}

/**
 * ensure we have a valid round
 * 
 * @param round 
 * @returns 
 */
function convertToValidRound(round: string): string {
    const validRounds = ['final', 'semi-final', 'semi-final-1', 'semi-final-2'];
    const lowercaseRound = round.toLowerCase();

    if (validRounds.includes(lowercaseRound)) {
        return lowercaseRound;
    }

    // Default to 'final' if an invalid round is provided
    throw new Error(`Invalid round "${round}" provided. Defaulting to "final".`);
    return 'final';
}

/**
 * Returns true if the vote code has a source country variable. 
 * e.g. f-t > false, f-t-gb > true
 * 
 * @param voteCode
 * @returns 
 */
export function voteCodeHasSourceCountry(voteCode: string) {
    if (!voteCode.length) {
        return false;
    }
    let voteCodeParts = voteCode.split('-');

    return voteCodeParts?.length === 3 && voteCodeParts[2]?.length;
}

/**
 * Determines whether the vote code has a certain vote type code 
 * t = total, tv = televote, j = jury
 * 
 * @param voteCode  e.g. f-tv-gb
 * @param typeCode  e.g. tv
 * @returns 
 */
export function voteCodeHasType(voteCode: string, typeCode: string): boolean {
    if (!voteCode) {
        return false;
    }
    let typeCodes = voteCode.split('-')?.[1]?.split('.');
    return typeCodes?.includes(typeCode);
}

export function updateVoteTypeCode(
    currentCode: string | undefined,
    voteType: string,
    add: boolean
): string {
    if (!currentCode && !add) {
        return '';
    }

    // Ensure the round is present
    if (!currentCode || !currentCode.startsWith('f-')) {
        currentCode = 'f-';
    }

    // Extract the vote type section of the code
    let codes = currentCode.split('-');

    let voteTypes = codes?.[1]?.split('.');

    if (!voteTypes?.[0]?.length) {
        voteTypes = [];
    }

    if (add) {
        // Add vote type if it's not already present
        if (!voteTypes.includes(voteType)) {
            voteTypes.push(voteType);
        }
    } else {
        // Remove vote type if it exists
        voteTypes = voteTypes.filter(v => v !== voteType);
    }

    let newVoteCode = codes[0];
    let newTypeString = voteTypes.join('.');

    if (!newTypeString?.length) {
        return newVoteCode;
    }

    newVoteCode += `-${newTypeString}`;

    if (codes[2]) {
        newVoteCode += `-${codes[2]}`
    }
    return newVoteCode;
}

function getVoteTypeFieldName(voteType: string) {
    switch (voteType?.toLowerCase()) {
        case 'tv':
        case 'tele':
        case 'tele-vote':
        case 'televote':
            return 'telePoints';
        case 'j':
        case 'jury':
            return 'juryPoints';
        default:
            return 'totalPoints';
    }
}

function getContestantVoteFieldValue(
    votes?: ContestantVotes,
    fieldName?: string
): number {
    if (!votes) {
        return 0;
    }
    let value = votes[fieldName as keyof ContestantVotes] as string;
    return parseInt(value, 10);
}


export async function assignVotesByCode(
    countryContestants: CountryContestant[],
    voteCode: string,
): Promise<CountryContestant[]> {

    const years = new Set(
        countryContestants
            .filter(cc => cc.contestant?.year)
            .map(cc => cc.contestant!.year)
    );

    let votes: Vote[];

    if (years.size > 1) {
        const yearCountryPairs = countryContestants
            .filter(cc => cc.contestant?.year)
            .map(cc => ({
                year: cc.contestant!.year!,
                countryKey: cc.country.key
            }));

        const [roundCode, , fromCountryKey] = voteCode.split('-');
        const round = processVotingRound(roundCode);

        votes = await fetchVotesForYearsAndCountries(yearCountryPairs, round);

        console.log('getting votes by years');
        console.log(votes)
        if (fromCountryKey) {
            votes = votes.filter(v => v.fromCountryKey === fromCountryKey);
        }
    } else {
        const year = years.size === 1 ? sanitizeYear(Array.from(years)[0]!) : '';
        votes = await fetchVotesByCode(voteCode, year);
    }

    return assignVotes(countryContestants, votes);
}


export async function assignVotesByContestants(
    countryContestants: CountryContestant[],
    voteCode: string
): Promise<CountryContestant[]> {

    //let newCountryContestants = clone(countryContestants)

    let { fromCountryKey, round } = getVoteCodeSettings(voteCode);

    if (!fromCountryKey?.length && round == 'Final') {
        console.log('use default');
        return countryContestants;
    }

    // convert string to number, return undefined for empty strings
    const parseVoteValue = (value: string | undefined): number | undefined => {
        if (value === undefined || value === '') return undefined;
        const num = Number(value);
        return isNaN(num) ? undefined : num;
    };

    // calculate the sum of points for each voting category
    const calculatePoints = (
        votes: Vote[],
        getPoints: (vote: Vote) => any | undefined
    ): number | undefined => {

        const validPoints = votes.map(
            vote => parseVoteValue(
                getPoints(vote)
            )
        ).filter(
            (point): point is number => point !== undefined
        );
        return validPoints.length > 0 ? validPoints.reduce(
            (sum, points) => sum + points, 0
        ) : undefined;
    };

    const updatedCountryContestants = await Promise.all(
        countryContestants.map(
            async (countryContestant: CountryContestant) => {

                if (countryContestant.contestant) {

                    let votes: Vote[] = await fetchVotesForYear(
                        countryContestant.contestant?.year!,
                        fromCountryKey,
                        round,
                        countryContestant.country.key!
                    );

                    // console.log(countryContestant)
                    // console.log(fromCountryKey)
                    // console.log(countryContestant.contestant?.year!)
                    // console.log(countryContestant.country.key!)
                    // console.log(votes)

                    let contestantVotes: ContestantVotes = {
                        round: round,
                        year: countryContestant.contestant?.year!,
                        totalPoints: calculatePoints(votes, vote => vote.totalPoints),
                        juryPoints: calculatePoints(votes, vote => vote.juryPoints),
                        telePoints: calculatePoints(votes, vote => vote.telePoints),
                    }

                    const updatedContestant = {
                        ...countryContestant.contestant,
                        votes: contestantVotes,
                    };
                    return {
                        ...countryContestant,
                        contestant: updatedContestant,
                    };
                } else {
                    return countryContestant;
                }
            }));

    return updatedCountryContestants;
}

function getVoteCodeSettings(voteCode: string) {
    let codes = voteCode?.split("-");

    let roundCode = codes?.[0];
    let voteTypeCode = codes?.[1];
    let fromCountryKey = codes?.[2];

    let round = processVotingRound(roundCode);
    return { fromCountryKey, round };
}

export async function fetchVotesByCode(voteCode: string, year: string, toCountryKey?: string) {

    let { fromCountryKey, round } = getVoteCodeSettings(voteCode);

    let votes: Vote[] = await fetchVotesForYear(
        year, fromCountryKey, round, toCountryKey
    );
    return votes;
}


function processVotingRound(round: string) {
    if (round === 'f') {
        round = 'final';
    } else if (round === 'sf') {
        round = 'semi-final';
    } else {
        //throw new Error("Invalid voting round param value " + round);
        round = 'final';
    }
    return round;
}


