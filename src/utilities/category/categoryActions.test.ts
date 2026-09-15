import { clearCategories, deleteCategory, saveCategories } from './categoryActions';
import { Category } from './types';
import rootReducer, {
  setActiveCategory,
  setCategories,
  setCategoryRankings,
  setShowTotalRank,
} from '../../redux/rootSlice';
import { CountryContestant } from '../../data/CountryContestant';

import { configureStore } from '@reduxjs/toolkit';

function makeStore() {
  return configureStore({ reducer: { root: rootReducer } });
}

const countryContestant = (id: string): CountryContestant =>
  ({
    id,
    country: { id, name: id.toUpperCase(), key: id, icon: '' },
    contestant: null,
  }) as CountryContestant;

const ranking = (...ids: string[]) => ids.map(countryContestant);

const ids = (store: ReturnType<typeof makeStore>) =>
  store.getState().root.categoryRankings.map((slot) => slot.map((cc) => cc.id));

const categories: Category[] = [
  { name: 'vocals', weight: 5 },
  { name: 'staging', weight: 3 },
];

describe('clearCategories', () => {
  it('keeps the chosen category as the one remaining ranking', () => {
    const store = makeStore();
    store.dispatch(setCategories(categories));
    store.dispatch(setCategoryRankings([ranking('a', 'b'), ranking('b', 'a')]));

    clearCategories(1, store.dispatch);

    expect(ids(store)).toEqual([['b', 'a']]);
    expect(store.getState().root.categories).toEqual([]);
    expect(store.getState().root.activeCategory).toBeUndefined();
  });

  it('stops showing the combined rank once there are no categories', () => {
    const store = makeStore();
    store.dispatch(setShowTotalRank(true));

    clearCategories(0, store.dispatch);

    expect(store.getState().root.showTotalRank).toBe(false);
  });
});

describe('saveCategories', () => {
  it('gives every category a ranking to hold', () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([ranking('a', 'b')]));

    saveCategories(categories, store.dispatch, [], undefined);

    expect(store.getState().root.categories).toEqual(categories);
    expect(ids(store)).toEqual([
      ['a', 'b'],
      ['a', 'b'],
    ]);
  });

  it('starts a newly added category from the order on screen', () => {
    const store = makeStore();
    store.dispatch(setCategories(categories));
    store.dispatch(setCategoryRankings([ranking('a', 'b'), ranking('b', 'a')]));
    store.dispatch(setActiveCategory(0));

    saveCategories([...categories, { name: 'song', weight: 1 }], store.dispatch, categories, 0);

    expect(ids(store)).toEqual([
      ['a', 'b'],
      ['b', 'a'],
      ['a', 'b'],
    ]);
  });

  it('keeps the ranking on screen when every category is removed', () => {
    const store = makeStore();
    store.dispatch(setCategories(categories));
    store.dispatch(setCategoryRankings([ranking('a', 'b'), ranking('b', 'a')]));

    saveCategories([], store.dispatch, categories, 1);

    expect(ids(store)).toEqual([['b', 'a']]);
    expect(store.getState().root.categories).toEqual([]);
  });
});

describe('deleteCategory', () => {
  it('removes the category along with its ranking', () => {
    const store = makeStore();
    store.dispatch(setCategories(categories));
    store.dispatch(setCategoryRankings([ranking('a', 'b'), ranking('b', 'a')]));

    deleteCategory(0, store.dispatch, categories, 1);

    expect(store.getState().root.categories).toEqual([categories[1]]);
    expect(ids(store)).toEqual([['b', 'a']]);
  });

  it('shows the first category when the one on screen is deleted', () => {
    const store = makeStore();
    store.dispatch(setCategories(categories));
    store.dispatch(setActiveCategory(1));

    deleteCategory(1, store.dispatch, categories, 1);

    expect(store.getState().root.activeCategory).toBe(0);
  });

  it('keeps showing the same category when an earlier one is deleted', () => {
    const three = [...categories, { name: 'song', weight: 1 }];
    const store = makeStore();
    store.dispatch(setCategories(three));
    store.dispatch(setActiveCategory(2));

    deleteCategory(0, store.dispatch, three, 2);

    expect(store.getState().root.activeCategory).toBe(1);
  });

  it('keeps showing the same category when a later one is deleted', () => {
    const three = [...categories, { name: 'song', weight: 1 }];
    const store = makeStore();
    store.dispatch(setCategories(three));
    store.dispatch(setActiveCategory(0));

    deleteCategory(2, store.dispatch, three, 0);

    expect(store.getState().root.activeCategory).toBe(0);
  });

  it('falls back to a single category less ranking when the last one goes', () => {
    const store = makeStore();
    const one = [categories[0]!];
    store.dispatch(setCategories(one));
    store.dispatch(setCategoryRankings([ranking('a', 'b')]));
    store.dispatch(setActiveCategory(0));

    deleteCategory(0, store.dispatch, one, 0);

    expect(store.getState().root.categories).toEqual([]);
    expect(store.getState().root.activeCategory).toBeUndefined();
    expect(ids(store)).toEqual([['a', 'b']]);
  });
});
