import { Dispatch } from 'redux';
import { setName, setYear, setRankedItems, setUnrankedItems, setContestants, setTheme, setVote } from '../redux/actions';
import { fetchCountryContestantsByYear } from './ContestantRepository';
import { CountryContestant } from '../data/CountryContestant';
import { countries } from '../data/Countries';
import { defaultYear, sanitizeYear } from '../data/Contestants';
import { getRankingComparison } from './RankAnalyzer';

/**
 * Updates states based on extracted parameters using Redux.
 */
export const updateStates = (
    params: {
        rankingName: string | null,
        contestYear: string | null,
        theme: string | null,
        voteCode: string | null
    },
    dispatch: Dispatch<any>
) => {
    let { rankingName, contestYear, theme, voteCode } = params;
    
    if (rankingName) {
        dispatch(
            setName(rankingName)
        );
    }

    dispatch(
        setTheme(theme ?? "")
    );

    dispatch(
        setVote(voteCode ?? "")
    );

    if (contestYear?.length) {
        contestYear = sanitizeYear(contestYear);
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
export async function processAndUpdateRankings(
    contestYear: string,
    rankings: string | null,
    voteCode: string | null,
    dispatch: Dispatch<any>
): Promise<string[] | undefined> {

    const yearContestants = await fetchCountryContestantsByYear(
        contestYear, 
        voteCode ?? '',
        dispatch
    );

    dispatch(
        setContestants(yearContestants)
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
            setRankedItems([])
        );
        dispatch(
            setUnrankedItems(yearContestants)
        );
    }
};

/**
 * Decodes rankings from URL and updates Redux store accordingly.
 */
export async function decodeRankingsFromURL(
    dispatch: Dispatch<any>
): Promise<string[] | undefined> {

    const params = new URLSearchParams(window.location.search);

    const extractedParams = extractParams(params);
    updateStates(extractedParams, dispatch);

    return await processAndUpdateRankings(
        extractedParams.contestYear || defaultYear, 
        extractedParams.rankings,
        extractedParams.voteCode,
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
        rankingName: params.get('n'), 
        contestYear: params.get('y'), 
        rankings: params.get('r'),   
        theme: params.get('t'),         // e.g. ab
        voteCode: params.get('v')       // e.g. {round}-{type}-{fromCountryKey} f-t-gb
    };
};

  /**
   * Function to update the query parameters
   */
  export function updateQueryParams(params: { [key: string]: string }) {
    const searchParams = new URLSearchParams(window.location.search);

    // Set new or update existing parameters
    Object.keys(params).forEach(key => {
      searchParams.set(key, params[key]);
    });

    const newUrl = '?' + searchParams.toString();
    const currentUrl = window.location.search;

    // Update the URL without reloading the page
    if (newUrl !== currentUrl) {
        window.history.pushState(null, '', newUrl);
    }
  }
