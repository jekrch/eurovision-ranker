import { Dispatch } from 'redux';
import { setName, setYear, setRankedItems, setUnrankedItems, setContestants, setTheme, setVote } from '../redux/actions';
import { fetchCountryContestantsByYear } from './ContestantRepository';
import { CountryContestant } from '../data/CountryContestant';
import { countries } from '../data/Countries';
import { defaultYear, sanitizeYear } from '../data/Contestants';
import { getRankingComparison } from './RankAnalyzer';
import { Category } from './CategoryUtil';

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
        const { rankedIds, rankedCountries } = orderContestantsByRankingStr(
            rankings, yearContestants
        );

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

export function getOrderedContestantsByCategory(
    activeCategory: number | undefined,
    countryContestants: CountryContestant[]
) {
    const params = new URLSearchParams(window.location.search);
    const extractedParams = extractParams(params, activeCategory);

    return orderContestantsByRankingStr(
        extractedParams.rankings ?? '',
        countryContestants
    );
}

export function orderContestantsByRankingStr(
    rankings: string,
    yearContestants: CountryContestant[],
) {
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
                    const newContestant = new CountryContestant(country);
                    return newContestant;
                } else {
                    return;
                }
            }
        }
    ).filter(Boolean) as CountryContestant[];
    return { rankedIds, rankedCountries };
}

export function urlHasRankings(activeCategory: number | undefined) {
    const extractedParams = getUrlParams(activeCategory);
    return extractedParams.rankings?.length;
}

/**
 * Decodes rankings from URL and updates Redux store accordingly.
 */
export async function decodeRankingsFromURL(
    activeCategory: number | undefined,
    dispatch: Dispatch<any>
): Promise<string[] | undefined> {

    const extractedParams = getUrlParams(activeCategory);

    // console.log(activeCategory)
    // console.log(window.location.search)
    // console.log(extractedParams.rankings)
    // console.log(extractedParams.contestYear)
    updateStates(extractedParams, dispatch);

    return await processAndUpdateRankings(
        extractedParams.contestYear || defaultYear,
        extractedParams.rankings,
        extractedParams.voteCode,
        dispatch
    );
};

export function getUrlParams(activeCategory: number | undefined) {
    const params = new URLSearchParams(window.location.search);
    const extractedParams = extractParams(params, activeCategory);
    return extractedParams;
}

export function convertRankingsStrToArray(rankings: string): string[] {
    let rankedIds: string[] = [];
    let i = 0;

    while (i < rankings.length) {
        // skip the underscore and adjust for the next character or 
        // next two if it's a period
        if (rankings[i] === '_') {
            if (i + 1 < rankings.length) {
                if (rankings[i + 1] === '.' && i + 2 < rankings.length) {
                    rankedIds.push(rankings.substring(i, i + 3));
                    i += 3;
                } else {
                    rankedIds.push(rankings.substring(i, i + 2));
                    i += 2;
                }
            } else {
                // if underscore is the last character, just push it
                rankedIds.push(rankings[i]);
                i += 1;
            }
        }
        // check for the period and the next character
        else if (rankings[i] === '.' && i + 1 < rankings.length) {
            rankedIds.push(rankings.substring(i, i + 2));
            i += 2;
        }
        else {
            rankedIds.push(rankings[i]);
            i += 1;
        }
    }

    // Remove duplicates
    let uniqueSet = new Set(rankedIds);
    rankedIds = Array.from(uniqueSet);

    return rankedIds;
}

/**
 * Clear all the category rankings (rx parameters) from the URL
 * @param categories 
 */
export function clearAllRankingParams(categories: Category[]) {

    const searchParams = new URLSearchParams(window.location.search);

    categories.forEach((_, index) => {
        const categoryParam = `r${index + 1}`;
        searchParams.delete(categoryParam);
    });

    // Clear the main ranking (r parameter) from the URL
    searchParams.delete('r');

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.replaceState(null, '', newUrl);
}

export const extractParams = (params: URLSearchParams, activeCategory: number | undefined) => {
    return {
        rankingName: params.get('n'),
        contestYear: params.get('y'),
        rankings: params.get(`r${activeCategory !== undefined ? activeCategory + 1 : ''}`),
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