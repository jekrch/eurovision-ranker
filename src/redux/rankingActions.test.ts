// @vitest-environment jsdom
import { combineReducers, configureStore } from '@reduxjs/toolkit';

import { deleteRankedCountry, reloadRankingsForYear } from './rankingActions';
import rootReducer, {
  setActiveCategory,
  setCategories,
  setCategoryRankings,
  setGlobalSearch,
  setUnrankedItems,
  setVote,
} from './rootSlice';
import { Contestant } from '../data/Contestant';
import { countries } from '../data/Countries';
import { CountryContestant } from '../data/CountryContestant';

const repository = vi.hoisted(() => ({
  fetchCountryContestantsByYear: vi.fn(),
  getCountryContestantsByUids: vi.fn(),
}));

vi.mock('../utilities/ContestantRepository', () => repository);

function makeStore() {
  return configureStore({ reducer: combineReducers({ root: rootReducer }) });
}

const country = (name: string) => countries.find((c) => c.name === name)!;

function countryContestant(name: string, year = '2023'): CountryContestant {
  const c = country(name);
  return {
    id: c.id,
    uid: `${c.id}${year}`,
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

const names = (items: CountryContestant[]) => items.map((cc) => cc.country.name);

beforeEach(() => {
  repository.fetchCountryContestantsByYear.mockReset().mockResolvedValue([]);
  repository.getCountryContestantsByUids.mockReset().mockResolvedValue([]);
  window.history.replaceState(null, '', '/');
});

describe('deleteRankedCountry', () => {
  it('takes the country out of the ranking', async () => {
    const store = makeStore();
    store.dispatch(
      setCategoryRankings([[countryContestant('Croatia'), countryContestant('Cyprus')]]),
    );

    await store.dispatch(deleteRankedCountry(country('Croatia').id));

    expect(names(store.getState().root.categoryRankings[0]!)).toEqual(['Cyprus']);
  });

  it('returns the country to the unranked list in alphabetical order', async () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([[countryContestant('Cyprus')]]));
    store.dispatch(setUnrankedItems([countryContestant('Croatia'), countryContestant('Denmark')]));

    await store.dispatch(deleteRankedCountry(country('Cyprus').id));

    expect(names(store.getState().root.unrankedItems)).toEqual(['Croatia', 'Cyprus', 'Denmark']);
  });

  it('returns a country that sorts last to the end of the unranked list', async () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([[countryContestant('Denmark')]]));
    store.dispatch(setUnrankedItems([countryContestant('Croatia')]));

    await store.dispatch(deleteRankedCountry(country('Denmark').id));

    expect(names(store.getState().root.unrankedItems)).toEqual(['Croatia', 'Denmark']);
  });

  it('takes the country out of every category, not only the one on screen', async () => {
    const store = makeStore();
    store.dispatch(
      setCategories([
        { name: 'vocals', weight: 1 },
        { name: 'staging', weight: 1 },
      ]),
    );
    store.dispatch(
      setCategoryRankings([
        [countryContestant('Croatia'), countryContestant('Cyprus')],
        [countryContestant('Cyprus'), countryContestant('Croatia')],
      ]),
    );
    store.dispatch(setActiveCategory(0));

    await store.dispatch(deleteRankedCountry(country('Cyprus').id));

    const { categoryRankings } = store.getState().root;
    expect(names(categoryRankings[0]!)).toEqual(['Croatia']);
    expect(names(categoryRankings[1]!)).toEqual(['Croatia']);
  });

  it('reports a country that is not ranked', async () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([[countryContestant('Croatia')]]));

    const result = await store.dispatch(deleteRankedCountry(country('Cyprus').id));

    expect(result.type).toBe(deleteRankedCountry.rejected.type);
  });
});

describe('reloadRankingsForYear', () => {
  it('keeps the ranked order while refreshing the entries to the new year', async () => {
    const store = makeStore();
    store.dispatch(
      setCategoryRankings([
        [countryContestant('Cyprus', '2023'), countryContestant('Croatia', '2023')],
      ]),
    );
    repository.fetchCountryContestantsByYear.mockResolvedValue([
      countryContestant('Croatia', '2018'),
      countryContestant('Cyprus', '2018'),
    ]);

    await store.dispatch(reloadRankingsForYear('2018'));

    const ranked = store.getState().root.categoryRankings[0]!;
    expect(names(ranked)).toEqual(['Cyprus', 'Croatia']);
    expect(ranked.map((cc) => cc.contestant?.year)).toEqual(['2018', '2018']);
  });

  it('refreshes every category, not only the one on screen', async () => {
    const store = makeStore();
    store.dispatch(
      setCategories([
        { name: 'vocals', weight: 1 },
        { name: 'staging', weight: 1 },
      ]),
    );
    store.dispatch(
      setCategoryRankings([
        [countryContestant('Cyprus', '2023')],
        [countryContestant('Croatia', '2023')],
      ]),
    );
    repository.fetchCountryContestantsByYear.mockResolvedValue([
      countryContestant('Croatia', '2018'),
      countryContestant('Cyprus', '2018'),
    ]);

    await store.dispatch(reloadRankingsForYear('2018'));

    const { categoryRankings } = store.getState().root;
    expect(names(categoryRankings[0]!)).toEqual(['Cyprus']);
    expect(names(categoryRankings[1]!)).toEqual(['Croatia']);
  });

  it('offers the countries nobody ranked as the unranked list', async () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([[countryContestant('Cyprus', '2023')]]));
    repository.fetchCountryContestantsByYear.mockResolvedValue([
      countryContestant('Croatia', '2018'),
      countryContestant('Cyprus', '2018'),
      countryContestant('Denmark', '2018'),
    ]);

    await store.dispatch(reloadRankingsForYear('2018'));

    expect(names(store.getState().root.unrankedItems)).toEqual(['Croatia', 'Denmark']);
  });

  it('asks for the year with the vote type currently being shown', async () => {
    const store = makeStore();
    store.dispatch(setVote('f-tv-gb'));

    await store.dispatch(reloadRankingsForYear('2018'));

    expect(repository.fetchCountryContestantsByYear).toHaveBeenCalledWith('2018', 'f-tv-gb');
  });

  it('asks for the year without a vote type before one has loaded', async () => {
    const store = makeStore();

    await store.dispatch(reloadRankingsForYear('2018'));

    expect(repository.fetchCountryContestantsByYear).toHaveBeenCalledWith('2018', '');
  });

  it('leaves nothing unranked while every contest is being searched', async () => {
    const store = makeStore();
    store.dispatch(setGlobalSearch(true));
    store.dispatch(setUnrankedItems([countryContestant('Croatia')]));
    repository.getCountryContestantsByUids.mockResolvedValue([countryContestant('Cyprus')]);

    await store.dispatch(reloadRankingsForYear('2018'));

    expect(store.getState().root.unrankedItems).toEqual([]);
    expect(repository.fetchCountryContestantsByYear).not.toHaveBeenCalled();
  });
});
