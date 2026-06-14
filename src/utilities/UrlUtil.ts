import { fetchCountryContestantsByYear, getCountryContestantsByUids } from './ContestantRepository';
import { defaultYear, sanitizeYear } from '../data/Contestants';
import { countries } from '../data/Countries';
import { CountryContestant, createCountryContestant } from '../data/CountryContestant';
import { parseCategoriesUrlParam } from './category/categoryUrl';
import {
  setName,
  setYear,
  setRankedItems,
  setCategoryRankings,
  setUnrankedItems,
  setContestants,
  setTheme,
  setVote,
  setShowComparison,
  setGlobalSearch,
  setShowThumbnail,
  setShowPlace,
} from '../redux/rootSlice';
import { AppDispatch } from '../redux/store';

export type UrlParams = {
  rankingName: string | null; // n
  contestYear: string | null; // y
  rankings: string | null; // r
  theme: string | null; // t: ab
  voteCode: string | null; // v: {round}-{type}-{fromCountryKey} f-t-gb
  comparisonMode: string | null; // cm: t/f
  globalMode: string | null; // g: t/f/null
  showThumbnail: string | null; // p: t/f
  showPlace: string | null; // pl: t/f
};

/**
 * Updates states based on extracted parameters using Redux.
 */
export const updateStates = (params: UrlParams, dispatch: AppDispatch) => {
  const { rankingName, theme, voteCode, comparisonMode, globalMode, showThumbnail, showPlace } =
    params;
  let { contestYear } = params; // reassigned below via sanitizeYear

  if (rankingName) {
    dispatch(setName(rankingName));
  }

  dispatch(setGlobalSearch(globalMode === 't'));

  dispatch(setShowComparison(comparisonMode === 't'));

  dispatch(setShowThumbnail(showThumbnail !== 'f'));

  dispatch(setShowPlace(showPlace === 't'));

  dispatch(setTheme(theme ?? ''));

  dispatch(setVote(voteCode ?? ''));

  if (contestYear?.length) {
    contestYear = sanitizeYear(contestYear);
    dispatch(setYear(contestYear));
  } else {
    // set default
    dispatch(setYear(defaultYear));
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
  dispatch: AppDispatch,
): Promise<string[] | undefined> {
  const isGlobalMode = globalMode === 't';

  let yearContestants;
  if (!isGlobalMode) {
    yearContestants = await fetchCountryContestantsByYear(contestYear, voteCode ?? '');

    dispatch(setContestants(yearContestants));
  }

  if (rankingsString) {
    const { rankedIds, rankedCountries } = await orderContestantsByRankingStr(
      rankingsString,
      yearContestants,
      isGlobalMode,
    );

    dispatch(setRankedItems(rankedCountries));

    if (isGlobalMode) {
      dispatch(setUnrankedItems([]));
    } else {
      const unrankedCountries = yearContestants?.filter(
        (countryContestant) => !rankedIds.includes(countryContestant.id),
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
  countryContestants: CountryContestant[],
) {
  const params = new URLSearchParams(window.location.search);
  const extractedParams = extractParams(params, activeCategory);

  return orderContestantsByRankingStr(
    extractedParams.rankings ?? '',
    countryContestants,
    extractedParams.globalMode === 't',
    extractedParams.voteCode ?? '',
  );
}

export async function orderContestantsByRankingStr(
  rankings: string,
  yearContestants?: CountryContestant[],
  isGlobalMode?: boolean,
  voteCode?: string,
) {
  const rankedIds = convertRankingsStrToArray(rankings, isGlobalMode);

  if (isGlobalMode) {
    const rankedCountries: CountryContestant[] = await getCountryContestantsByUids(
      rankedIds,
      voteCode,
    );
    return { rankedIds, rankedCountries };
  }

  const rankedCountries = rankedIds
    .map((id: string) => {
      const countryContestant: CountryContestant | undefined = yearContestants?.find((c) =>
        isGlobalMode ? c.uid === id : c.id === id,
      );
      if (countryContestant) {
        return countryContestant;
      } else if (!isGlobalMode) {
        const country = countries.find((c) => c.id === id);
        if (country) {
          return createCountryContestant(country);
        }
      }
      return undefined;
    })
    .filter(Boolean) as CountryContestant[];

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
  dispatch: AppDispatch,
): Promise<string[] | undefined> {
  const extractedParams: UrlParams = getUrlParams(activeCategory);

  updateStates(extractedParams, dispatch);

  return await processAndUpdateRankings(
    extractedParams.contestYear || defaultYear,
    extractedParams.rankings,
    extractedParams.voteCode,
    extractedParams.globalMode,
    dispatch,
  );
}

/**
 * Decodes *every* category's ranking from the URL into the store at once. This
 * is a URL -> store input used at the two legitimate entry points (boot and
 * back/forward navigation): it seeds categoryRankings for all categories so the
 * store is self-sufficient and switching tabs never needs to re-read the URL.
 *
 * Categories are read straight from the URL (`c`) rather than the store so a
 * back/forward navigation to a different category configuration still resolves
 * the correct per-category params.
 */
export async function loadAllCategoryRankingsFromURL(
  activeCategory: number | undefined,
  dispatch: AppDispatch,
): Promise<string[] | undefined> {
  const params = new URLSearchParams(window.location.search);
  const categoriesParam = params.get('c');
  const categories = categoriesParam ? parseCategoriesUrlParam(categoriesParam) : [];

  const baseParams = extractParams(params, activeCategory);
  updateStates(baseParams, dispatch);

  const isGlobalMode = baseParams.globalMode === 't';

  let yearContestants: CountryContestant[] | undefined;
  if (!isGlobalMode) {
    yearContestants = await fetchCountryContestantsByYear(
      baseParams.contestYear || defaultYear,
      baseParams.voteCode ?? '',
    );
    dispatch(setContestants(yearContestants));
  }

  // One slot per category; with no categories there is a single ranking in the
  // `r` param (slot 0).
  const slotCount = categories.length || 1;
  const activeSlot = categories.length ? (activeCategory ?? 0) : 0;

  const categoryRankings: CountryContestant[][] = [];
  let activeRankedIds: string[] = [];

  for (let i = 0; i < slotCount; i++) {
    const paramCategory = categories.length ? i : undefined;
    const slotParams = extractParams(params, paramCategory);
    const { rankedIds, rankedCountries } = await orderContestantsByRankingStr(
      slotParams.rankings ?? '',
      yearContestants,
      isGlobalMode,
      slotParams.voteCode ?? '',
    );
    categoryRankings[i] = rankedCountries;
    if (i === activeSlot) {
      activeRankedIds = rankedIds;
    }
  }

  dispatch(setCategoryRankings(categoryRankings));

  if (isGlobalMode) {
    dispatch(setUnrankedItems([]));
  } else {
    const unrankedCountries = yearContestants?.filter(
      (countryContestant) => !activeRankedIds.includes(countryContestant.id),
    );
    dispatch(setUnrankedItems(unrankedCountries ?? []));
  }

  return activeRankedIds.length ? activeRankedIds : undefined;
}

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
  isGlobalMode: boolean = urlParamHasValue('g', 't'),
): string => {
  // Drop items missing the id this mode encodes (e.g. a country resolved without
  // a `uid` re-encoded into global mode) rather than emitting an undefined gap.
  const ids = rankedCountries
    .map((item) => (isGlobalMode ? item.uid : item.id))
    .filter(Boolean);
  return isGlobalMode ? `>${ids.join('')}` : ids.join('');
};

export function convertRankingsStrToArray(rankings: string, isGlobalMode?: boolean): string[] {
  if (isGlobalMode || rankings.startsWith('>')) {
    // remove the leading '>' and split into 3-character chunks
    return rankings.startsWith('>') ? rankings.slice(1).match(/.{1,3}/g) || [] : [];
  }

  const rankedIds: string[] = [];
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
}

export const extractParams = (
  params: URLSearchParams,
  activeCategory: number | undefined,
): UrlParams => {
  return {
    rankingName: params.get('n'),
    contestYear: params.get('y'),
    rankings: params.get(`r${activeCategory !== undefined ? activeCategory + 1 : ''}`),
    theme: params.get('t'), // e.g. ab
    voteCode: params.get('v'), // e.g. {round}-{type}-{fromCountryKey} f-t-gb
    comparisonMode: params.get('cm'), // e.g. t/f
    globalMode: params.get('g'), // e.g. t/f/null
    showThumbnail: params.get('p'), // e.g. t/f/null
    showPlace: params.get('pl'), // e.g. t/f/null
  } as UrlParams;
};

/**
 * Function to update the query parameters
 */
export function updateQueryParams(params: { [key: string]: string | undefined }) {
  const searchParams = new URLSearchParams(window.location.search);

  // Set new or update existing parameters
  Object.keys(params).forEach((key) => {
    if (params[key]) searchParams.set(key, params[key]);
    else searchParams.delete(key);
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
