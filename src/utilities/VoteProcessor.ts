import { sanitizeYear } from "../data/Contestants";
import { CountryContestant } from '../data/CountryContestant';
import { ContestantVotes, Vote } from "../data/Vote";
import { fetchVotesForYear } from "./VoteRepository";
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
    year: string,
    voteType: string,
    round: string = 'final',
    fromCountryKey?: string
): Promise<CountryContestant[]> {

    year = sanitizeYear(year);

    let votes: Vote[] = await getVotes(year, fromCountryKey, round)

    let voteTypeFieldName: string = getVoteTypeFieldName(voteType);

    countryContestants = assignVotes(
        countryContestants, votes
    );

    // Sorting country contestants by votes in descending order
    countryContestants.sort(
        (a, b) => (getContestantVoteFieldValue(b.contestant?.votes, voteTypeFieldName)) -
                  (getContestantVoteFieldValue(a.contestant?.votes, voteTypeFieldName))   
    );

    // if there is a source country, filter out 0 votes, otherwise, keep them
    if (fromCountryKey?.length) {
        return countryContestants.filter(
            // filter out any countries with 0 votes
            v => {
                return getContestantVoteFieldValue(v.contestant?.votes, voteTypeFieldName) > 0;
            }
        );
    } else {
        return countryContestants;
    }
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
    year: string,
    voteCode: string,
): Promise<CountryContestant[]> {

    let votes: Vote[] = await fetchVotesByCode(voteCode, year);

    return assignVotes(
        countryContestants,
        votes
    );
}

export async function fetchVotesByCode(voteCode: string, year: string) {
    let codes = voteCode?.split("-");

    let roundCode = codes?.[0];
    let voteTypeCode = codes?.[1];
    let fromCountryKey = codes?.[2];

    let round = processVotingRound(roundCode);
    //let voteTypeFieldName: string = getVoteTypeFieldName(voteTypeCode);
    let votes: Vote[] = await fetchVotesForYear(year, fromCountryKey, round);
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


