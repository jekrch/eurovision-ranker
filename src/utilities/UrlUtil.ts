import { CountryContestant } from "../data/CountryContestant";
import { fetchCountryContestantsByYear } from "./ContestantFactory";

/**
 * Extracts parameters from URLSearchParams.
 */
export const extractParams = (params: URLSearchParams) => {
    return {
        rankingName: params.get('n'), // 'name' for name
        contestYear: params.get('y'), // 'y' for year 
        rankings: params.get('r')     // 'r' for rankings
    };
};

/**
 * Updates states based on extracted parameters.
 */
export const updateStatesFromParams = (
    params: {
        rankingName: string | null,
        contestYear: string | null
    },
    setName: (name: string) => void,
    setYear: (year: string) => void
) => {

    let { rankingName, contestYear } = params;

    if (rankingName) {
        setName(rankingName);
    }

    if (contestYear) {
        if (contestYear.length === 2) {
            contestYear = '20' + contestYear;
        }
        setYear(contestYear);
    }
};

/**
 * Fetches and processes rankings, then updates contestant states.
 */
export const processAndUpdateRankings = (
    contestYear: string,
    rankings: string | null,
    setRankedItems: (items: CountryContestant[]) => void,
    setUnrankedItems: (items: CountryContestant[]) => void
): string[] | undefined => {
    const yearContestants = fetchCountryContestantsByYear(contestYear);

    if (rankings) {
        const rankedIds = convertRankingsStrToArray(rankings);
        const rankedCountries = rankedIds.map(
            id => yearContestants.find(
                country => country.country.key === id
                )
            ).filter(Boolean) as CountryContestant[];

        const unrankedCountries = yearContestants.filter(
            countryContestant => !rankedIds.includes(countryContestant.country.key)
        );

        setRankedItems(rankedCountries);
        setUnrankedItems(unrankedCountries);

        return rankedIds;
    } else {
        setUnrankedItems(yearContestants);
    }
};

/**
 * Decodes rankings from URL and updates states accordingly.
 */
export const decodeRankingsFromURL = (
    setName: (name: string) => void,
    setYear: (year: string) => void,
    setRankedItems: (items: CountryContestant[]) => void,
    setUnrankedItems: (items: CountryContestant[]) => void
): string[] | undefined => {

    const params = new URLSearchParams(window.location.search);
    const extractedParams = extractParams(params);

    updateStatesFromParams(extractedParams, setName, setYear);

    return processAndUpdateRankings(
        extractedParams.contestYear || '23',
        extractedParams.rankings,
        setRankedItems,
        setUnrankedItems
    );
};

function convertRankingsStrToArray(rankings: string) {
    let rankedIds: string[] = [];

    for (let i = 0; i < rankings.length; i += 2) {
        rankedIds.push(rankings.substring(i, i + 2));
    }

    // remove duplicates 
    let uniqueSet = new Set(rankedIds);
    rankedIds = Array.from(uniqueSet);

    return rankedIds;
}