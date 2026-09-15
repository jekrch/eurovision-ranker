// @vitest-environment jsdom
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

const repository = vi.hoisted(() => ({
  fetchCountryContestantsByYear: vi.fn(),
  getCountryContestantsByUids: vi.fn(),
}));

// Stub the I/O boundaries so the table mounts without fetching CSVs or
// rewriting the URL.
vi.mock('../../utilities/CsvCache', () => ({ fetchContestantCsv: vi.fn() }));
vi.mock('../../utilities/ContestantRepository', () => repository);
vi.mock('../../utilities/UrlUtil', () => ({
  getUrlParam: vi.fn().mockReturnValue(null),
  updateQueryParams: vi.fn(),
  loadRankingsFromURL: vi.fn(),
  urlHasRankings: vi.fn().mockReturnValue(false),
  encodeRankingsToURL: vi.fn().mockReturnValue(''),
  orderContestantsByRankingStr: vi.fn().mockResolvedValue({ rankedIds: [], rankedCountries: [] }),
}));
// react-tooltip's mount effect probes CSS APIs jsdom doesn't implement.
vi.mock('../TooltipHelp', () => ({ default: () => null }));

import ContestantTable from './ContestantTable';
import { Contestant } from '../../data/Contestant';
import { CountryContestant } from '../../data/CountryContestant';
import { makeTestStore, storeWrapper } from '../../test/storeHarness';

const countryContestant = (id: string, year: string): CountryContestant =>
  ({
    id,
    uid: `${year}-${id}`,
    country: { id, name: id.toUpperCase(), key: id, icon: '' },
    contestant: new Contestant({
      id: `${year}-${id}`,
      countryKey: id,
      artist: 'artist',
      song: 'song',
      year,
    }),
  }) as CountryContestant;

function table({
  ranked = [] as CountryContestant[],
  globalSearch = true,
}: { ranked?: CountryContestant[]; globalSearch?: boolean } = {}) {
  const store = makeTestStore({
    root: { globalSearch, year: '2023', categoryRankings: [ranked] },
  });
  render(<ContestantTable />, { wrapper: storeWrapper(store) });
  return store;
}

const toggle = (label: string) =>
  fireEvent.click(screen.getByText(label).parentElement!.querySelector('button')!);

beforeEach(() => {
  repository.fetchCountryContestantsByYear.mockReset().mockResolvedValue([]);
  repository.getCountryContestantsByUids.mockReset().mockResolvedValue([]);
  window.history.replaceState(null, '', '/');
});

describe('turning on searching across every contest', () => {
  it('switches the table to every contest', async () => {
    const store = table({ globalSearch: false });

    await act(async () => toggle('adv'));

    expect(store.getState().root.globalSearch).toBe(true);
  });

  it('keeps the ranking as it is', async () => {
    const ranked = [countryContestant('a', '2023')];
    const store = table({ ranked, globalSearch: false });

    await act(async () => toggle('adv'));

    expect(store.getState().root.categoryRankings[0]).toHaveLength(1);
  });
});

describe('turning it off with a ranking from one contest', () => {
  it('returns the table to that contest without asking', async () => {
    const ranked = [countryContestant('a', '2018'), countryContestant('b', '2018')];
    const store = table({ ranked });

    await act(async () => toggle('adv'));

    expect(store.getState().root.globalSearch).toBe(false);
    expect(store.getState().root.year).toBe('2018');
    expect(screen.queryByText(/Are you sure/)).toBeNull();
  });

  it('refreshes the ranking against that contest', async () => {
    const ranked = [countryContestant('a', '2018')];
    table({ ranked });

    await act(async () => toggle('adv'));

    await waitFor(() =>
      expect(repository.fetchCountryContestantsByYear).toHaveBeenCalledWith('2018', ''),
    );
  });
});

describe('turning it off with a ranking spanning several contests', () => {
  const spread = () => [countryContestant('a', '2023'), countryContestant('b', '2018')];

  it('warns that the ranking cannot be kept', async () => {
    table({ ranked: spread() });

    await act(async () => toggle('adv'));

    expect(screen.getByText(/Your current selections will be cleared/)).toBeTruthy();
  });

  it('stays on every contest until the warning is answered', async () => {
    const store = table({ ranked: spread() });

    await act(async () => toggle('adv'));

    expect(store.getState().root.globalSearch).toBe(true);
  });

  it('clears the ranking once the warning is accepted', async () => {
    const store = table({ ranked: spread() });
    await act(async () => toggle('adv'));

    await act(async () => fireEvent.click(screen.getByText('Confirm')));

    await waitFor(() => expect(store.getState().root.globalSearch).toBe(false));
    await waitFor(() => expect(store.getState().root.categoryRankings[0]).toEqual([]));
  });

  it('keeps the ranking when the warning is dismissed', async () => {
    const store = table({ ranked: spread() });
    await act(async () => toggle('adv'));

    await act(async () => fireEvent.click(screen.getByText('Cancel')));

    expect(store.getState().root.globalSearch).toBe(true);
    expect(store.getState().root.categoryRankings[0]).toHaveLength(2);
  });
});

describe('turning it off with nothing ranked', () => {
  it('returns the table to a single contest without asking', async () => {
    const store = table({ ranked: [] });

    await act(async () => toggle('adv'));

    expect(store.getState().root.globalSearch).toBe(false);
    expect(screen.queryByText(/Are you sure/)).toBeNull();
  });

  it('starts the contest list over', async () => {
    table({ ranked: [] });

    await act(async () => toggle('adv'));

    await waitFor(() =>
      expect(repository.fetchCountryContestantsByYear).toHaveBeenCalledWith('2023', ''),
    );
  });
});

describe('the ranking list', () => {
  it('is opened from the table', async () => {
    const store = table();

    await act(async () => fireEvent.click(screen.getByText('View List')));

    expect(store.getState().root.showUnranked).toBe(true);
  });
});
