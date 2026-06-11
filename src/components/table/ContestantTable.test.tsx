// @vitest-environment jsdom
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Stub the I/O boundaries reached through useContestantTable et al. so the
// component mounts without fetching the contestant CSV or rewriting the URL.
vi.mock('../../utilities/CsvCache', () => ({ fetchContestantCsv: vi.fn() }));
vi.mock('../../utilities/ContestantRepository', () => ({
  getCountryContestantsByUids: vi.fn().mockResolvedValue([]),
}));
vi.mock('../../utilities/ContestantUtil', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utilities/ContestantUtil')>()),
  convertRankingUrlParamsByMode: vi.fn(),
}));
vi.mock('../../utilities/UrlUtil', () => ({
  getUrlParam: vi.fn().mockReturnValue(null),
  updateQueryParams: vi.fn(),
  updateUrlFromRankedItems: vi.fn(),
  loadRankingsFromURL: vi.fn(),
  urlHasRankings: vi.fn().mockReturnValue(false),
}));
// react-tooltip's mount effect probes CSS APIs that jsdom doesn't implement;
// it's irrelevant to this smoke test, so render a no-op stub.
vi.mock('../TooltipHelp', () => ({ default: () => null }));

import ContestantTable from './ContestantTable';
import { ContestantRow } from './tableTypes';
import { makeTestStore, storeWrapper } from '../../test/storeHarness';

const row = (id: string): ContestantRow => ({
  id,
  year: 2024,
  to_country_id: id,
  to_country: `Country ${id}`,
  performer: `Performer ${id}`,
  song: `Song ${id}`,
  place_contest: 1,
});

describe('ContestantTable (smoke)', () => {
  it('renders the table shell with the search bar and mode switches', () => {
    const entries = [row('1'), row('2')];
    const store = makeTestStore({ table: { tableState: { entries } } });

    const { container } = render(<ContestantTable />, { wrapper: storeWrapper(store) });

    // the table scaffold and the two mode toggles ("adv"/"selected") are present
    // (getByText throws if the node is absent, so these assert presence)
    expect(container.querySelector('table')).toBeTruthy();
    expect(screen.getByText('adv')).toBeTruthy();
    expect(screen.getByText('selected')).toBeTruthy();
  });
});
