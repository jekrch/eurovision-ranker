// @vitest-environment jsdom
import { combineReducers, configureStore } from '@reduxjs/toolkit';

import rootReducer, { setCategories, setUnrankedItems, setCategoryRankings } from './rootSlice';
import tableReducer, {
  addAllPaginatedContestants,
  addAllUnranked,
  changePageSize,
  filterTable,
  setEntries,
  setPaginatedContestants,
  setSelectedContestants,
  setTableCurrentPage,
  sortTable,
} from './tableSlice';
import { ContestantRow } from '../components/table/tableTypes';
import { CountryContestant } from '../data/CountryContestant';

function makeStore() {
  return configureStore({
    reducer: combineReducers({ root: rootReducer, table: tableReducer }),
  });
}

const row = (id: string): ContestantRow => ({ id, countryKey: id }) as unknown as ContestantRow;

const countryContestant = (id: string): CountryContestant =>
  ({
    id,
    country: { id, name: id.toUpperCase(), key: id, icon: '' },
    contestant: null,
  }) as CountryContestant;

const tableState = (store: ReturnType<typeof makeStore>) => store.getState().table.tableState;

beforeEach(() => window.history.replaceState(null, '', '/'));

describe('sorting', () => {
  it('sorts a newly chosen column from the top', async () => {
    const store = makeStore();

    await store.dispatch(sortTable('artist'));

    expect(tableState(store)).toMatchObject({ sortColumn: 'artist', sortDirection: 'asc' });
  });

  it('reverses the order when the same column is chosen again', async () => {
    const store = makeStore();

    await store.dispatch(sortTable('artist'));
    await store.dispatch(sortTable('artist'));

    expect(tableState(store)).toMatchObject({ sortColumn: 'artist', sortDirection: 'desc' });
  });

  it('starts from the top again after moving to another column', async () => {
    const store = makeStore();

    await store.dispatch(sortTable('artist'));
    await store.dispatch(sortTable('artist'));
    await store.dispatch(sortTable('song'));

    expect(tableState(store)).toMatchObject({ sortColumn: 'song', sortDirection: 'asc' });
  });
});

describe('filtering and paging', () => {
  it('returns to the first page when the filters change', async () => {
    const store = makeStore();
    store.dispatch(setTableCurrentPage(4));

    await store.dispatch(filterTable({ year: 2023 }));

    expect(tableState(store)).toMatchObject({ filters: { year: 2023 }, currentPage: 1 });
  });

  it('returns to the first page when the page size changes', async () => {
    const store = makeStore();
    store.dispatch(setTableCurrentPage(4));

    await store.dispatch(changePageSize(50));

    expect(tableState(store)).toMatchObject({ pageSize: 50, currentPage: 1 });
  });

  it('moves to the requested page', () => {
    const store = makeStore();

    store.dispatch(setTableCurrentPage(3));

    expect(tableState(store).currentPage).toBe(3);
  });
});

describe('selection', () => {
  it('selects every contestant on the current page', () => {
    const store = makeStore();
    store.dispatch(setPaginatedContestants([row('a'), row('b')]));

    store.dispatch(addAllPaginatedContestants());

    expect(tableState(store).selectedContestants.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('leaves an already selected contestant selected once', () => {
    const store = makeStore();
    store.dispatch(setSelectedContestants([row('a')]));
    store.dispatch(setPaginatedContestants([row('a'), row('b')]));

    store.dispatch(addAllPaginatedContestants());

    expect(tableState(store).selectedContestants.map((c) => c.id)).toEqual(['a', 'b']);
  });

  it('keeps selections made on other pages', () => {
    const store = makeStore();
    store.dispatch(setSelectedContestants([row('z')]));
    store.dispatch(setPaginatedContestants([row('a')]));

    store.dispatch(addAllPaginatedContestants());

    expect(tableState(store).selectedContestants.map((c) => c.id)).toEqual(['z', 'a']);
  });

  it('holds the rows the table is showing', () => {
    const store = makeStore();

    store.dispatch(setEntries([row('a')]));

    expect(tableState(store).entries.map((c) => c.id)).toEqual(['a']);
  });
});

describe('adding every unranked country', () => {
  it('moves all unranked countries onto the end of the ranking', async () => {
    const store = makeStore();
    store.dispatch(setCategoryRankings([[countryContestant('a')]]));
    store.dispatch(setUnrankedItems([countryContestant('b'), countryContestant('c')]));

    await store.dispatch(addAllUnranked());

    const { categoryRankings, unrankedItems } = store.getState().root;
    expect(categoryRankings[0]!.map((cc) => cc.id)).toEqual(['a', 'b', 'c']);
    expect(unrankedItems).toEqual([]);
  });

  it('adds them to every category, not only the one on screen', async () => {
    const store = makeStore();
    store.dispatch(
      setCategories([
        { name: 'vocals', weight: 5 },
        { name: 'staging', weight: 3 },
      ]),
    );
    store.dispatch(setCategoryRankings([[countryContestant('a')], []]));
    store.dispatch(setUnrankedItems([countryContestant('b')]));

    await store.dispatch(addAllUnranked());

    const { categoryRankings } = store.getState().root;
    expect(categoryRankings[0]!.map((cc) => cc.id)).toEqual(['a', 'b']);
    expect(categoryRankings[1]!.map((cc) => cc.id)).toEqual(['b']);
  });

  it('records the added countries in each category of the shareable address', async () => {
    const store = makeStore();
    window.history.replaceState(null, '', '/?r1=a&r2=a');
    store.dispatch(
      setCategories([
        { name: 'vocals', weight: 5 },
        { name: 'staging', weight: 3 },
      ]),
    );
    store.dispatch(setUnrankedItems([countryContestant('b'), countryContestant('c')]));

    await store.dispatch(addAllUnranked());

    const params = new URLSearchParams(window.location.search);
    expect(params.get('r1')).toBe('abc');
    expect(params.get('r2')).toBe('abc');
  });

  it('leaves the address alone when no categories are in use', async () => {
    const store = makeStore();
    window.history.replaceState(null, '', '/?r=a');
    store.dispatch(setUnrankedItems([countryContestant('b')]));

    await store.dispatch(addAllUnranked());

    expect(window.location.search).toBe('?r=a');
  });
});
