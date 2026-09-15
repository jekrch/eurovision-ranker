import rootReducer, {
  addCountryToOtherCategories,
  assignVotesToContestants,
  clearAllCategoryRankings,
  enterPublicView,
  exitPublicView,
  removeCategoryRankingSlot,
  removeCountryFromCategories,
  setActiveCategory,
  setCategories,
  setCategoryRankingAtSlot,
  setCategoryRankings,
  setContestants,
  setGlobalSearch,
  setName,
  setRankedItems,
  setUnrankedItems,
  setYear,
} from './rootSlice';
import { Contestant } from '../data/Contestant';
import { CountryContestant } from '../data/CountryContestant';
import { Vote } from '../data/Vote';

import { configureStore } from '@reduxjs/toolkit';

function makeStore() {
  return configureStore({ reducer: { root: rootReducer } });
}

const countryContestant = (id: string, year = '2023'): CountryContestant =>
  ({
    id,
    uid: `${id}-uid`,
    country: { id, name: id.toUpperCase(), key: id, icon: '' },
    contestant: new Contestant({
      id: `${id}-${year}`,
      countryKey: id,
      artist: 'artist',
      song: 'song',
      year,
    }),
  }) as CountryContestant;

const ranking = (...ids: string[]) => ids.map((id) => countryContestant(id));

const slots = (store: ReturnType<typeof makeStore>) =>
  store.getState().root.categoryRankings.map((slot) => slot.map((cc) => cc.id));

describe('the ranking on screen', () => {
  it('writes to the single ranking when no category is chosen', () => {
    const store = makeStore();

    store.dispatch(setRankedItems(ranking('a', 'b')));

    expect(slots(store)).toEqual([['a', 'b']]);
  });

  it('writes to the category being shown', () => {
    const store = makeStore();
    store.dispatch(
      setCategories([
        { name: 'vocals', weight: 1 },
        { name: 'staging', weight: 1 },
      ]),
    );
    store.dispatch(setCategoryRankings([[], []]));
    store.dispatch(setActiveCategory(1));

    store.dispatch(setRankedItems(ranking('a')));

    expect(slots(store)).toEqual([[], ['a']]);
  });

  it('always keeps a ranking to write into', () => {
    const store = makeStore();

    store.dispatch(setCategoryRankings([]));

    expect(slots(store)).toEqual([[]]);
  });
});

describe('ranking a country across categories', () => {
  it('adds a newly ranked country to the categories not on screen', () => {
    const store = makeStore();
    store.dispatch(
      setCategories([
        { name: 'vocals', weight: 1 },
        { name: 'staging', weight: 1 },
      ]),
    );
    store.dispatch(setCategoryRankings([ranking('a'), ranking('a')]));
    store.dispatch(setActiveCategory(0));

    store.dispatch(addCountryToOtherCategories(countryContestant('b')));

    expect(slots(store)).toEqual([['a'], ['a', 'b']]);
  });

  it('removes a deleted country from every category', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([ranking('a', 'b'), ranking('b', 'a')]));

    store.dispatch(removeCountryFromCategories('b'));

    expect(slots(store)).toEqual([['a'], ['a']]);
  });

  it('removes a country matched by the identifier used across contests', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([ranking('a', 'b')]));

    store.dispatch(removeCountryFromCategories('b-uid'));

    expect(slots(store)).toEqual([['a']]);
  });

  it('empties every category when the ranking is reset', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([ranking('a', 'b'), ranking('b')]));

    store.dispatch(clearAllCategoryRankings());

    expect(slots(store)).toEqual([[], []]);
  });

  it('replaces one category without disturbing the others', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([ranking('a'), ranking('b')]));

    store.dispatch(setCategoryRankingAtSlot({ index: 1, ranking: ranking('c', 'd') }));

    expect(slots(store)).toEqual([['a'], ['c', 'd']]);
  });

  it('keeps a ranking to write into after the last category is removed', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([ranking('a')]));

    store.dispatch(removeCategoryRankingSlot(0));

    expect(slots(store)).toEqual([[]]);
  });
});

describe('a ranking opened from a share link', () => {
  it('is shown by its share id', () => {
    const store = makeStore();

    store.dispatch(enterPublicView('abc123'));

    expect(store.getState().root).toMatchObject({ viewMode: 'public', publicViewId: 'abc123' });
  });

  it.each([
    ['the order changes', setRankedItems(ranking('a'))],
    ['a country is removed', removeCountryFromCategories('a')],
    ['it is renamed', setName('My copy')],
    ['the year changes', setYear('2018')],
  ])('becomes the viewer own ranking when %s', (_case, action) => {
    const store = makeStore();
    store.dispatch(enterPublicView('abc123'));

    store.dispatch(action);

    expect(store.getState().root).toMatchObject({
      viewMode: 'normal',
      publicViewId: undefined,
    });
  });

  it('can be left without an edit', () => {
    const store = makeStore();
    store.dispatch(enterPublicView('abc123'));

    store.dispatch(exitPublicView());

    expect(store.getState().root).toMatchObject({ viewMode: 'normal', publicViewId: undefined });
  });
});

describe('assigning votes', () => {
  const votes: Vote[] = [
    {
      year: '2023',
      round: 'final',
      fromCountryKey: 'se',
      toCountryKey: 'a',
      totalPoints: 12,
    },
  ];

  it('scores the ranked contestants', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([ranking('a', 'b')]));

    store.dispatch(assignVotesToContestants(votes));

    const [first, second] = store.getState().root.categoryRankings[0]!;
    expect(first!.contestant!.votes).toMatchObject({ totalPoints: 12 });
    expect(second!.contestant!.votes).toBeUndefined();
  });

  it('scores the contestants that have not been ranked yet', () => {
    const store = makeStore();
    store.dispatch(setUnrankedItems(ranking('a')));

    store.dispatch(assignVotesToContestants(votes));

    expect(store.getState().root.unrankedItems[0]!.contestant!.votes).toMatchObject({
      totalPoints: 12,
    });
  });

  it('scores the full list of contestants for the year', () => {
    const store = makeStore();
    store.dispatch(setContestants(ranking('a')));

    store.dispatch(assignVotesToContestants(votes));

    expect(store.getState().root.contestants[0]!.contestant!.votes).toMatchObject({
      totalPoints: 12,
    });
  });

  it('leaves a contestant from another year unscored', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([[countryContestant('a', '2018')]]));

    store.dispatch(assignVotesToContestants(votes));

    expect(store.getState().root.categoryRankings[0]![0]!.contestant!.votes).toBeUndefined();
  });
});

describe('searching across every contest', () => {
  it('is off until it is turned on', () => {
    const store = makeStore();

    expect(store.getState().root.globalSearch).toBe(false);

    store.dispatch(setGlobalSearch(true));

    expect(store.getState().root.globalSearch).toBe(true);
  });
});
