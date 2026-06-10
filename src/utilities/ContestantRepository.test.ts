import { describe, it, expect, vi, beforeEach } from 'vitest';

// Contestant data is parsed from CSVs fetched over the network and then has
// votes attached. Mock the CSV source so we control the rows, and stub vote
// assignment to a pass-through so these tests focus on parsing + country joins.
const fetchContestantCsv = vi.fn();
vi.mock('./CsvCache', () => ({
  fetchContestantCsv: (year: string) => fetchContestantCsv(year),
  fetchVoteCsv: vi.fn(),
  fetchLyricsCsv: vi.fn(),
}));
vi.mock('./VoteProcessor', () => ({
  assignVotesByContestants: (ccs: unknown) => Promise.resolve(ccs),
}));

import {
  getContestantsForYear,
  fetchCountryContestantsByYear,
} from './ContestantRepository';

const HEADER =
  'id,year,to_country_id,performer,song,youtube_url,place_contest,place_final,place_sf,points_final,points_tele_final,points_jury_final';

const row = (
  id: string,
  year: string,
  countryKey: string,
  performer: string,
  song: string,
  placeContest = '',
  placeFinal = '',
  placeSf = '',
  pointsFinal = ''
) =>
  `${id},${year},${countryKey},${performer},${song},,${placeContest},${placeFinal},${placeSf},${pointsFinal},,`;

beforeEach(() => {
  fetchContestantCsv.mockReset();
});

describe('getContestantsForYear', () => {
  it('parses CSV rows into Contestant objects for the requested year', async () => {
    // include an off-year row to confirm it is filtered out
    fetchContestantCsv.mockResolvedValue(
      [
        HEADER,
        row('2023-se', '2023', 'se', 'Loreen', 'Tattoo', '1', '', '', '583'),
        row('2023-fi', '2023', 'fi', 'Käärijä', 'Cha Cha Cha', '2', '', '', '526'),
        row('2019-nl', '2019', 'nl', 'Duncan Laurence', 'Arcade', '1', '', '', '498'),
      ].join('\n')
    );

    const contestants = await getContestantsForYear('2023');

    expect(contestants).toHaveLength(2);
    const se = contestants.find((c) => c.countryKey === 'se')!;
    expect(se.artist).toBe('Loreen');
    expect(se.song).toBe('Tattoo');
    expect(se.finalsRank).toBe(1);
    expect(se.votes?.totalPoints).toBe(583);
    expect(se.year).toBe('2023');
  });

  it('falls back to place_final when place_contest is empty', async () => {
    fetchContestantCsv.mockResolvedValue(
      [HEADER, row('2018-il', '2018', 'il', 'Netta', 'Toy', '', '1')].join('\n')
    );

    const [netta] = await getContestantsForYear('2018');
    expect(netta.finalsRank).toBe(1);
  });

  it('leaves numeric fields undefined when the CSV cell is blank', async () => {
    fetchContestantCsv.mockResolvedValue(
      [HEADER, row('2017-pt', '2017', 'pt', 'Salvador Sobral', 'Amar Pelos Dois')].join(
        '\n'
      )
    );

    const [pt] = await getContestantsForYear('2017');
    expect(pt.finalsRank).toBeUndefined();
    expect(pt.votes?.totalPoints).toBeUndefined();
  });

  it('caches results so a repeated fetch is not re-parsed', async () => {
    fetchContestantCsv.mockResolvedValue(
      [HEADER, row('2014-at', '2014', 'at', 'Conchita Wurst', 'Rise Like a Phoenix', '1')].join(
        '\n'
      )
    );

    await getContestantsForYear('2014');
    await getContestantsForYear('2014');
    // second call served from the year cache
    expect(fetchContestantCsv).toHaveBeenCalledTimes(1);
  });
});

describe('fetchCountryContestantsByYear', () => {
  it('joins each contestant to its country and sorts by country name', async () => {
    fetchContestantCsv.mockResolvedValue(
      [
        HEADER,
        row('2015-se', '2015', 'se', 'Måns Zelmerlöw', 'Heroes', '1', '', '', '365'),
        row('2015-au', '2015', 'au', 'Guy Sebastian', 'Tonight Again', '5', '', '', '196'),
        row('2015-be', '2015', 'be', 'Loïc Nottet', 'Rhythm Inside', '4', '', '', '217'),
      ].join('\n')
    );

    const ccs = await fetchCountryContestantsByYear('2015');

    // sorted alphabetically by country name: Australia, Belgium, Sweden
    expect(ccs.map((cc) => cc.country.name)).toEqual([
      'Australia',
      'Belgium',
      'Sweden',
    ]);
    const sweden = ccs.find((cc) => cc.country.key === 'se')!;
    expect(sweden.contestant?.artist).toBe('Måns Zelmerlöw');
    expect(sweden.id).toBe(sweden.country.id);
  });
});
