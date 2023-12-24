import { Dispatch } from 'redux';
import { setName, setYear, setRankedItems, setUnrankedItems } from '../redux/actions';
import { fetchCountryContestantsByYear } from './ContestantFactory';
import { CountryContestant } from '../data/CountryContestant';
import { countries } from '../data/Countries';
import { defaultYear } from '../data/Contestants';
import { getRankingComparison } from './RankAnalyzer';

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
        dispatch(
            setName(rankingName)
        );
    }

    if (contestYear?.length) {
        if (contestYear.length === 2) {
            contestYear = '20' + contestYear;
        }
        dispatch(
            setYear(contestYear)
        );
    } else {
        // set default
        dispatch(
            setYear(defaultYear)
        );
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
    const yearContestants = fetchCountryContestantsByYear(
        contestYear, dispatch
    );

    if (rankings) {

        // let compare = getRankingComparison(
        //     contestYear, rankings, "envw4g.gmckyjib.dod16f.ca7.bhq" // 2023 finals
        // );
        // console.log(compare);

        const rankedIds = convertRankingsStrToArray(rankings);

        const rankedCountries = rankedIds.map(
            (id: string) => {
                let countryContestant: CountryContestant | undefined = yearContestants.find(
                    c => c.id === id
                );
                if (countryContestant) {
                    return countryContestant;
                } else {
                    const country = countries.find(c => c.id === id);
                    if (country) {
                        return new CountryContestant(country);
                    } else {
                        return;
                    }
                }
            }
    ).filter(Boolean) as CountryContestant[];

        const unrankedCountries = yearContestants.filter(
            countryContestant => !rankedIds.includes(countryContestant.id)
        );

        dispatch(
            setRankedItems(rankedCountries)
        );
        dispatch(
            setUnrankedItems(unrankedCountries)
        );

        return rankedIds;
    } else {
        dispatch(
            setUnrankedItems(yearContestants)
        );
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
        extractedParams.contestYear || defaultYear, 
        extractedParams.rankings,
        dispatch
    );
};

export function convertRankingsStrToArray(rankings: string): string[] {
    let rankedIds: string[] = [];
    let i = 0;

    while (i < rankings.length) {
        // Check for the period and the next character
        if (rankings[i] === '.' && i + 1 < rankings.length) {
            rankedIds.push(rankings.substring(i, i + 2));
            i += 2;
        } else {
            rankedIds.push(rankings[i]);
            i += 1;
        }
    }

    // Remove duplicates
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
