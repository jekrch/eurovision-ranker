import { Dispatch } from 'redux';
import { setName, setYear, setRankedItems, setUnrankedItems } from '../redux/actions';
import { fetchCountryContestantsByYear } from './ContestantFactory';
import { CountryContestant } from '../data/CountryContestant';
import { countries } from '../data/Countries';

/**
 * Updates states based on extracted parameters using Redux.
 */
export const updateStates = (
    params: {
        rankingName: string | null,
        contestYear: string | null
    },
    dispatch: Dispatch<any>
) => {
    let { rankingName, contestYear } = params;

    if (rankingName) {
        dispatch(setName(rankingName));
    }

    if (contestYear) {
        if (contestYear.length === 2) {
            contestYear = '20' + contestYear;
        }
        dispatch(setYear(contestYear));
    }
};

/**
 * Fetches and processes rankings, then updates contestant states using Redux.
 */
export const processAndUpdateRankings = (
    contestYear: string,
    rankings: string | null,
    dispatch: Dispatch<any>
): string[] | undefined => {
    const yearContestants = fetchCountryContestantsByYear(contestYear);

    if (rankings) {
        const rankedIds = convertRankingsStrToArray(rankings);

        const rankedCountries = rankedIds.map(
            (id: string) => {
                let countryContestant: CountryContestant | undefined = yearContestants.find(
                    c => c.country.key === id
                );
                if (countryContestant) {
                    return countryContestant;
                } else {
                    const country = countries.find(c => c.key === id);
                    if (country) {
                        return new CountryContestant(country);
                    } else {
                        return;
                    }
                }
            }
    ).filter(Boolean) as CountryContestant[];

        const unrankedCountries = yearContestants.filter(
            countryContestant => !rankedIds.includes(countryContestant.country.key)
        );

        dispatch(setRankedItems(rankedCountries));
        dispatch(setUnrankedItems(unrankedCountries));

        return rankedIds;
    } else {
        dispatch(setUnrankedItems(yearContestants));
    }
};

/**
 * Decodes rankings from URL and updates Redux store accordingly.
 */
export const decodeRankingsFromURL = (
    dispatch: Dispatch<any>
): string[] | undefined => {

    const params = new URLSearchParams(window.location.search);

    const extractedParams = extractParams(params);
    updateStates(extractedParams, dispatch);

    return processAndUpdateRankings(
        extractedParams.contestYear || '2023', // Default to '2023' if year is not specified
        extractedParams.rankings,
        dispatch
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

export const extractParams = (params: URLSearchParams) => {
    return {
        rankingName: params.get('n'), // 'name' for name
        contestYear: params.get('y'), // 'y' for year 
        rankings: params.get('r')     // 'r' for rankings
    };
};

