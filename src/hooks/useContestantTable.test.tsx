// @vitest-environment jsdom
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Stub every I/O boundary the hook touches so it can be exercised purely:
// the CSV fetch, the repository join, URL reads/writes, and logging.
vi.mock('../utilities/CsvCache', () => ({ fetchContestantCsv: vi.fn() }));
vi.mock('../utilities/ContestantRepository', () => ({
  getCountryContestantsByUids: vi.fn().mockResolvedValue([]),
}));
vi.mock('../utilities/ContestantUtil', () => ({ convertRankingUrlParamsByMode: vi.fn() }));
vi.mock('../utilities/UrlUtil', () => ({
  getUrlParam: vi.fn().mockReturnValue(null),
  updateQueryParams: vi.fn(),
  updateUrlFromRankedItems: vi.fn(),
}));
vi.mock('../utilities/logger', () => ({ logger: { error: vi.fn(), warn: vi.fn() } }));

import { useContestantTable } from './useContestantTable';
import { ContestantRow } from '../components/table/tableTypes';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

const row = (id: string, overrides: Partial<ContestantRow> = {}): ContestantRow => ({
  id,
  year: 2024,
  to_country_id: id,
  to_country: `Country ${id}`,
  performer: `Performer ${id}`,
  song: `Song ${id}`,
  place_contest: 1,
  ...overrides,
});

// 12 rows so a page size of 10 splits into two pages.
const entries: ContestantRow[] = Array.from({ length: 12 }, (_, i) => row(String(i + 1)));

const render = (preloaded: Parameters<typeof makeTestStore>[0]) => {
  const store = makeTestStore(preloaded);
  const hook = renderHook(() => useContestantTable(), { wrapper: storeWrapper(store) });
  return { store, ...hook };
};

describe('useContestantTable', () => {
  beforeEach(() => {
    window.history.replaceState(null, '', '/');
  });

  it('paginates the entries by the configured page size', () => {
    const { result } = render({ table: { tableState: { entries, pageSize: 10, currentPage: 1 } } });

    expect(result.current.totalPages).toBe(2);
    expect(result.current.paginatedContestants).toHaveLength(10);
    expect(result.current.displayedContestants).toHaveLength(12);
  });

  it('handleSearch filters the displayed rows across non-id fields', () => {
    const custom = [...entries, row('99', { performer: 'Zaphod Beeblebrox' })];
    const { result } = render({ table: { tableState: { entries: custom, pageSize: 50 } } });

    act(() => {
      result.current.handleSearch({
        target: { value: 'Zaphod' },
      } as React.ChangeEvent<HTMLInputElement>);
    });

    expect(result.current.searchTerm).toBe('Zaphod');
    expect(result.current.displayedContestants).toHaveLength(1);
    expect(result.current.displayedContestants[0].id).toBe('99');
  });

  it('handlePageChange updates the current page in the store', () => {
    const { result, store } = render({
      table: { tableState: { entries, pageSize: 10, currentPage: 1 } },
    });

    act(() => result.current.handlePageChange(2));

    expect(store.getState().table.tableState.currentPage).toBe(2);
    expect(result.current.paginatedContestants).toHaveLength(2);
  });

  it('handleToggleSelected adds the contestant to the selected set', async () => {
    const { result, store } = render({
      table: { tableState: { entries, pageSize: 10, currentPage: 1 } },
    });

    await act(async () => {
      result.current.handleToggleSelected('3');
    });

    await waitFor(() =>
      expect(store.getState().table.tableState.selectedContestants.map((c) => c.id)).toEqual(['3']),
    );
  });
});
