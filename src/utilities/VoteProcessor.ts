import { sanitizeYear } from "../data/Contestants";
import { CountryContestant } from "../data/CountryContestant";
import { Vote } from "../data/Vote";
import { fetchVotesForYear } from "./VoteRepository";

export async function sortByVotes(
    countryContestants: CountryContestant[],
    year: string,
    voteType: string,
    round: string = 'final',
    fromCountryKey?: string
): Promise<CountryContestant[]> {

    year = sanitizeYear(year);

    let votes: Vote[] = await fetchVotesForYear(year, fromCountryKey, round)

    let voteTypeFieldName: string = getVoteTypeFieldName(voteType);

    countryContestants = assignVotesToCountryContestants(
        votes, countryContestants, voteTypeFieldName
    );

    // Sorting country contestants by votes in descending order
    countryContestants.sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));

    return countryContestants;
}

function getVoteTypeFieldName(voteType: string) {
    switch (voteType) {
        case 'tv':
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

function assignVotesToCountryContestants(
    votes: Vote[],
    countryContestants: CountryContestant[],
    voteTypeFieldName: string,
): CountryContestant[] {
    // summing up the votes for each country
    const voteSums: { [key: string]: number; } = {};
    votes.forEach(vote => {
        if (!voteSums[vote.toCountryKey]) {
            voteSums[vote.toCountryKey] = 0;
        }
        let voteToAdd: number = getVoteFieldValue(vote, voteTypeFieldName);

        if (voteToAdd) {
            voteSums[vote.toCountryKey] += voteToAdd;
        }
    });

    // assigning summed votes to corresponding country contestants
    countryContestants.forEach(cc => {
        cc.votes = voteSums[cc.country.key];
    });

    return countryContestants;
}

function getVoteFieldValue(vote: Vote, fieldName: string): number {
    let value = vote[fieldName as keyof Vote] as string; 
    return parseInt(value, 10);
}

export async function assignVotesByCode(
    countryContestants: CountryContestant[],
    year: string,
    voteCode: string
): Promise<CountryContestant[]> {

    let codes = voteCode.split("-");

    let roundCode = codes[0];
    let voteTypeCode = codes[1];
    let fromCountryKey = codes[2];

    let round = processVotingRound(roundCode);
    let voteTypeFieldName: string = getVoteTypeFieldName(voteTypeCode);

    let votes: Vote[] = await fetchVotesForYear(year, fromCountryKey, round)

    return assignVotesToCountryContestants(
        votes,
        countryContestants, 
        voteTypeFieldName
    );
}

function processVotingRound(round: string) {
    if (round === 'f') {
        round = 'final';
    } else if (round === 'sf') {
        round = 'semi-final';
    } else {
        throw new Error("Invalid voting round param value " + round);
    }
    return round;
}
