// @vitest-environment jsdom
import { combineReducers, configureStore } from '@reduxjs/toolkit';

import {
  getOrderedContestantsByCategory,
  getUrlParam,
  goToUrl,
  loadAllCategoryRankingsFromURL,
  loadRankingsFromURL,
  processAndUpdateRankings,
  urlHasRankings,
} from './UrlUtil';
import { Contestant } from '../data/Contestant';
import { countries } from '../data/Countries';
import { CountryContestant } from '../data/CountryContestant';
import rootReducer from '../redux/rootSlice';

const repository = vi.hoisted(() => ({
  fetchCountryContestantsByYear: vi.fn(),
  getCountryContestantsByUids: vi.fn(),
}));

vi.mock('./ContestantRepository', () => repository);

function makeStore() {
  return configureStore({ reducer: combineReducers({ root: rootReducer }) });
}

const country = (name: string) => countries.find((c) => c.name === name)!;

function countryContestant(name: string, year = '2023'): CountryContestant {
  const c = country(name);
  return {
    id: c.id,
    uid: `${year.slice(2)}${c.id}`,
    country: c,
    contestant: new Contestant({
      id: `${c.key}-${year}`,
      countryKey: c.key,
      artist: `${name} artist`,
      song: `${name} song`,
      year,
    }),
  } as CountryContestant;
}

const CONTEST = ['Croatia', 'Cyprus', 'Denmark'].map((n) => countryContestant(n));

const setUrl = (search: string) => window.history.replaceState(null, '', search);
const names = (items: CountryContestant[]) => items.map((cc) => cc.country.name);
const ranked = (store: ReturnType<typeof makeStore>) =>
  names(store.getState().root.categoryRankings[0]!);

beforeEach(() => {
  repository.fetchCountryContestantsByYear.mockReset().mockResolvedValue(CONTEST);
  repository.getCountryContestantsByUids.mockReset().mockResolvedValue([]);
  setUrl('/');
});

describe('processAndUpdateRankings', () => {
  it('ranks the countries the ranking names, in order', async () => {
    const store = makeStore();
    const order = `${country('Cyprus').id}${country('Croatia').id}`;

    await processAndUpdateRankings('2023', order, null, null, store.dispatch);

    expect(ranked(store)).toEqual(['Cyprus', 'Croatia']);
  });

  it('offers the rest of the contest as still to rank', async () => {
    const store = makeStore();

    await processAndUpdateRankings('2023', country('Cyprus').id, null, null, store.dispatch);

    expect(names(store.getState().root.unrankedItems)).toEqual(['Croatia', 'Denmark']);
  });

  it('offers the whole contest to rank when the address holds no ranking', async () => {
    const store = makeStore();

    await processAndUpdateRankings('2023', null, null, null, store.dispatch);

    expect(ranked(store)).toEqual([]);
    expect(names(store.getState().root.unrankedItems)).toHaveLength(3);
  });

  it('reports which countries were ranked', async () => {
    const store = makeStore();

    const result = await processAndUpdateRankings(
      '2023',
      country('Cyprus').id,
      null,
      null,
      store.dispatch,
    );

    expect(result).toEqual([country('Cyprus').id]);
  });

  it('looks entries up across contests when searching them all', async () => {
    const store = makeStore();
    repository.getCountryContestantsByUids.mockResolvedValue([countryContestant('Cyprus', '2018')]);

    await processAndUpdateRankings('2023', '>18j', null, 't', store.dispatch);

    expect(repository.fetchCountryContestantsByYear).not.toHaveBeenCalled();
    expect(ranked(store)).toEqual(['Cyprus']);
    expect(store.getState().root.unrankedItems).toEqual([]);
  });

  it('leaves nothing to rank separately while searching every contest', async () => {
    const store = makeStore();

    await processAndUpdateRankings('2023', null, null, 't', store.dispatch);

    expect(store.getState().root.unrankedItems).toEqual([]);
  });

  it('asks for the contest with the vote type the address names', async () => {
    const store = makeStore();

    await processAndUpdateRankings('2023', null, 'f-tv-gb', null, store.dispatch);

    expect(repository.fetchCountryContestantsByYear).toHaveBeenCalledWith('2023', 'f-tv-gb');
  });
});

describe('loadRankingsFromURL', () => {
  it('restores the ranking held in the address', async () => {
    const store = makeStore();
    setUrl(`?y=23&r=${country('Denmark').id}${country('Croatia').id}`);

    await loadRankingsFromURL(undefined, store.dispatch);

    expect(ranked(store)).toEqual(['Denmark', 'Croatia']);
    expect(store.getState().root.year).toBe('2023');
  });

  it('restores the ranking of the category being shown', async () => {
    const store = makeStore();
    setUrl(`?c=vocals-5|staging-3&r1=${country('Croatia').id}&r2=${country('Denmark').id}`);

    await loadRankingsFromURL(1, store.dispatch);

    expect(ranked(store)).toEqual(['Denmark']);
  });
});

describe('loadAllCategoryRankingsFromURL', () => {
  it('restores every category ranking at once', async () => {
    const store = makeStore();
    setUrl(
      `?c=vocals-5|staging-3&r1=${country('Croatia').id}${country('Cyprus').id}&r2=${country('Denmark').id}`,
    );

    await loadAllCategoryRankingsFromURL(0, store.dispatch);

    const slots = store.getState().root.categoryRankings.map(names);
    expect(slots).toEqual([['Croatia', 'Cyprus'], ['Denmark']]);
  });

  it('offers what the shown category has not ranked as still to rank', async () => {
    const store = makeStore();
    setUrl(`?c=vocals-5|staging-3&r1=${country('Croatia').id}&r2=${country('Denmark').id}`);

    await loadAllCategoryRankingsFromURL(1, store.dispatch);

    expect(names(store.getState().root.unrankedItems)).toEqual(['Croatia', 'Cyprus']);
  });

  it('restores a single ranking when no categories are in use', async () => {
    const store = makeStore();
    setUrl(`?r=${country('Cyprus').id}`);

    await loadAllCategoryRankingsFromURL(undefined, store.dispatch);

    expect(store.getState().root.categoryRankings.map(names)).toEqual([['Cyprus']]);
  });

  it('reports the ranked countries so the caller can tell a ranking was found', async () => {
    const store = makeStore();
    setUrl(`?r=${country('Cyprus').id}`);

    const result = await loadAllCategoryRankingsFromURL(undefined, store.dispatch);

    expect(result).toEqual([country('Cyprus').id]);
  });

  it('reports nothing when the address holds no ranking', async () => {
    const store = makeStore();
    setUrl('?y=23');

    await expect(
      loadAllCategoryRankingsFromURL(undefined, store.dispatch),
    ).resolves.toBeUndefined();
  });

  it('looks entries up across contests when searching them all', async () => {
    const store = makeStore();
    repository.getCountryContestantsByUids.mockResolvedValue([countryContestant('Cyprus', '2018')]);
    setUrl('?g=t&r=>18j');

    await loadAllCategoryRankingsFromURL(undefined, store.dispatch);

    expect(repository.fetchCountryContestantsByYear).not.toHaveBeenCalled();
    expect(store.getState().root.unrankedItems).toEqual([]);
  });
});

describe('getOrderedContestantsByCategory', () => {
  it('orders the given contestants by the category ranking in the address', async () => {
    setUrl(`?c=vocals-5&r1=${country('Denmark').id}${country('Croatia').id}`);

    const { rankedCountries } = await getOrderedContestantsByCategory(0, CONTEST);

    expect(names(rankedCountries)).toEqual(['Denmark', 'Croatia']);
  });
});

describe('urlHasRankings', () => {
  it('recognises an address holding a ranking', () => {
    setUrl(`?r=${country('Cyprus').id}`);

    expect(urlHasRankings(undefined)).toBeTruthy();
  });

  it('recognises an address holding only an empty ranking', () => {
    setUrl('?r=>');

    expect(urlHasRankings(undefined)).toBeFalsy();
  });

  it('recognises an address with no ranking at all', () => {
    setUrl('?y=23');

    expect(urlHasRankings(undefined)).toBeFalsy();
  });
});

describe('getUrlParam', () => {
  it('reads a value out of the address', () => {
    setUrl('?y=23');

    expect(getUrlParam('y')).toBe('23');
  });

  it('reads nothing for a value the address does not hold', () => {
    setUrl('?y=23');

    expect(getUrlParam('r')).toBeNull();
  });
});

describe('goToUrl', () => {
  it('keeps the chosen theme when leaving for another address', () => {
    const assign = vi.fn();
    Object.defineProperty(window, 'location', {
      value: {
        ...window.location,
        origin: 'https://app.test',
        pathname: '/',
        set href(v: string) {
          assign(v);
        },
      },
      configurable: true,
    });

    goToUrl('?r=abc', 'm');

    expect(assign).toHaveBeenCalledWith('https://app.test/?r=abc&t=m');
  });
});
