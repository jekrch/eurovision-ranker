
import { setName, setYear, setRankedItems, setUnrankedItems, setContestants, setTheme, setVote, setShowComparison, setGlobalSearch, setShowThumbnail } from '../redux/rootSlice';
import { fetchCountryContestantsByYear, getContestantsByUids, getCountryContestantsByUids } from './ContestantRepository';
import { CountryContestant, createCountryContestant } from '../data/CountryContestant';
import { countries } from '../data/Countries';
import { defaultYear, sanitizeYear } from '../data/Contestants';

import { Category } from './CategoryUtil';
import { AppDispatch } from '../redux/store';
import { Contestant } from '../data/Contestant';

export type UrlParams = {
    rankingName: string | null;     // n
    contestYear: string | null;     // y
    rankings: string | null;        // r
    theme: string | null;           // t: ab
    voteCode: string | null;        // v: {round}-{type}-{fromCountryKey} f-t-gb
    comparisonMode: string | null;  // cm: t/f
    globalMode: string | null       // g: t/f/null
    showThumbnail: string | null    // p: t/f
}

/**
 * Updates states based on extracted parameters using Redux.
 */
export const updateStates = (
    params: UrlParams,
    dispatch: AppDispatch
) => {
    let { rankingName, contestYear, theme, voteCode, comparisonMode, globalMode, showThumbnail } = params;

    if (rankingName) {
        dispatch(
            setName(rankingName)
        );
    }

    dispatch(
        setGlobalSearch(globalMode === 't')
    )

    dispatch(
        setShowComparison(comparisonMode === 't')
    );

    dispatch(
        setShowThumbnail(showThumbnail !== 'f')
    );

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
    rankingsString: string | null,
    voteCode: string | null,
    globalMode: string | null,
    dispatch: AppDispatch
): Promise<string[] | undefined> {
    const isGlobalMode = globalMode === 't';
    //console.log(isGlobalMode ? 'in global mode' : 'in normal mode');

    let yearContestants;
    if (!isGlobalMode) {
        yearContestants = await fetchCountryContestantsByYear(
            contestYear,
            voteCode ?? ''
        );

        dispatch(
            setContestants(yearContestants)
        );
    }

    if (rankingsString) {
        const { rankedIds, rankedCountries } = await orderContestantsByRankingStr(
            rankingsString, yearContestants, isGlobalMode
        );

        dispatch(
            setRankedItems(rankedCountries)
        );

        if (isGlobalMode) {
            dispatch(setUnrankedItems([]));
        } else {
            const unrankedCountries = yearContestants?.filter(
                countryContestant => !rankedIds.includes(countryContestant.id)
            );
            dispatch(setUnrankedItems(unrankedCountries!));
        }

        return rankedIds;
    } else {
        if (isGlobalMode) {
            dispatch(setRankedItems(yearContestants ?? []));
            dispatch(setUnrankedItems([]));
        } else {
            dispatch(setRankedItems([]));
            dispatch(setUnrankedItems(yearContestants ?? []));
        }
    }
}

export function getOrderedContestantsByCategory(
    activeCategory: number | undefined,
    countryContestants: CountryContestant[]
) {
    const params = new URLSearchParams(window.location.search);
    const extractedParams = extractParams(params, activeCategory);

    return orderContestantsByRankingStr(
        extractedParams.rankings ?? '',
        countryContestants,
        extractedParams.globalMode === 't',
        extractedParams.voteCode ?? ''
    );
}

export async function orderContestantsByRankingStr(
    rankings: string,
    yearContestants?: CountryContestant[],
    isGlobalMode?: boolean,
    voteCode?: string
) {
    const rankedIds = convertRankingsStrToArray(rankings, isGlobalMode);

    if (isGlobalMode) {
        const rankedCountries: CountryContestant[] = await getCountryContestantsByUids(
            rankedIds, 
            voteCode
        );
        return { rankedIds, rankedCountries }
    }

    const rankedCountries = rankedIds.map(
        (id: string) => {
            let countryContestant: CountryContestant | undefined = yearContestants?.find(
                c => isGlobalMode ? c.uid === id : c.id === id
            );
            if (countryContestant) {
                return countryContestant;
            } else if (!isGlobalMode) {
                const country = countries.find(c => c.id === id);
                if (country) {
                    return createCountryContestant(country);
                }
            }
            return undefined;
        }
    ).filter(Boolean) as CountryContestant[];

    return { rankedIds, rankedCountries };
}

export function urlHasRankings(activeCategory: number | undefined) {
    const extractedParams = getUrlParams(activeCategory);
    return extractedParams.rankings?.replace('>', '')?.length;
}

/**
 * Decodes rankings from URL and updates Redux store accordingly.
 */
export async function loadRankingsFromURL(
    activeCategory: number | undefined,
    dispatch: AppDispatch
): Promise<string[] | undefined> {

    const extractedParams: UrlParams = getUrlParams(activeCategory);

    // console.log(activeCategory)
    // console.log(window.location.search)
    // console.log(extractedParams.rankings)
    // console.log(extractedParams.contestYear)
    updateStates(extractedParams, dispatch);

    return await processAndUpdateRankings(
        extractedParams.contestYear || defaultYear,
        extractedParams.rankings,
        extractedParams.voteCode,
        extractedParams.globalMode,
        dispatch
    );
};

export function getUrlParams(activeCategory: number | undefined): UrlParams {
    const params = new URLSearchParams(window.location.search);
    return extractParams(params, activeCategory);
}

export function getUrlParam(paramName: string): string | null {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(paramName);
}

/**
 * Encode rankings to csv for URL
 */
export const encodeRankingsToURL = (
    rankedCountries: CountryContestant[], 
    isGlobalMode: boolean = urlParamHasValue('g', 't')
): string => {
    const ids = rankedCountries.map(item => isGlobalMode ? item.uid : item.id);
    return isGlobalMode ? `>${ids.join('')}` : ids.join('');
};


export function convertRankingsStrToArray(
    rankings: string,
    isGlobalMode?: boolean
): string[] {

    if (isGlobalMode || rankings.startsWith('>')) {
        // remove the leading '>' and split into 3-character chunks
        return rankings.startsWith('>') ? rankings.slice(1).match(/.{1,3}/g) || [] : [];
    }

    let rankedIds: string[] = [];
    let i = 0;

    while (i < rankings.length) {
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
                rankedIds.push(rankings[i]);
                i += 1;
            }
        } else if (rankings[i] === '.' && i + 1 < rankings.length) {
            rankedIds.push(rankings.substring(i, i + 2));
            i += 2;
        } else {
            rankedIds.push(rankings[i]);
            i += 1;
        }
    }

    // remove duplicates
    return Array.from(new Set(rankedIds));
}

export function urlParamHasValue(key: string, value: string) {
    const urlParams = new URLSearchParams(window.location.search);
    const rParam = urlParams.get(key);

    return rParam !== null && rParam === value;
};

/**
 * Clear all the category rankings (rx parameters) from the URL
 * @param categories 
 */
export function clearAllRankingParams(categories: Category[]): void {
    const url = new URL(window.location.href);
    const searchParams = url.searchParams;
  
    // clear category-specific parameters
    categories.forEach((_, index) => {
      const categoryParam = `r${index + 1}`;
      searchParams.delete(categoryParam);
    });
  
    // clear the main ranking parameter
    searchParams.delete('r');
  
    // update the URL without changing the origin
    url.search = searchParams.toString();
    
    // use pushState instead of replaceState to avoid potential issues
    window.history.pushState(null, '', url.toString());
  }

export const extractParams = (params: URLSearchParams, activeCategory: number | undefined): UrlParams => {
    return {
        rankingName: params.get('n'),
        contestYear: params.get('y'),
        rankings: params.get(`r${activeCategory !== undefined ? activeCategory + 1 : ''}`),
        theme: params.get('t'),           // e.g. ab
        voteCode: params.get('v'),        // e.g. {round}-{type}-{fromCountryKey} f-t-gb
        comparisonMode: params.get('cm'), // e.g. t/f
        globalMode: params.get('g'),       // e.g. t/f/null
        showThumbnail: params.get('p')       // e.g. t/f/null
    } as UrlParams;
};

export const updateUrlFromRankedItems = async (
    activeCategory: number | undefined,
    categories: Category[],
    rankedItems: CountryContestant[],
    isGlobalMode: boolean = urlParamHasValue('g', 't')
) => {
    const encodedRankings = encodeRankingsToURL(rankedItems, isGlobalMode);
    //console.log(encodedRankings)
    if (categories?.length > 0 && activeCategory !== undefined) {
        updateQueryParams({ [`r${activeCategory + 1}`]: encodedRankings });
    } else {
        updateQueryParams({ r: encodedRankings });
    }
};

/**
 * Function to update the query parameters
 */
export function updateQueryParams(params: { [key: string]: string | undefined }) {
    const searchParams = new URLSearchParams(window.location.search);

    // Set new or update existing parameters
    Object.keys(params).forEach(key => {
        if (params[key])
            searchParams.set(key, params[key]);
        else
            searchParams.delete(key);
    });

    const newUrl = '?' + searchParams.toString();
    const currentUrl = window.location.search;

    // Update the URL without reloading the page
    if (newUrl !== currentUrl) {
        window.history.pushState(null, '', newUrl);
    }
}

function getUrl(queryString: string) {
    const currentDomain = window.location.origin;
    const currentPath = window.location.pathname;

    return `${currentDomain}${currentPath}${queryString}`;
}

export function goToUrl(queryString: string, theme: string | undefined) {
    let url = getUrl(queryString);
    if (theme) {
        url += `&t=${theme}`;
    }
    window.location.href = url;
}