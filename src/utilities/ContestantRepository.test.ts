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

import { getContestantsForYear, fetchCountryContestantsByYear } from './ContestantRepository';

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
  pointsFinal = '',
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
      ].join('\n'),
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

  it('leaves numeric fields undefined when the CSV cell is blank', async () => {
    fetchContestantCsv.mockResolvedValue(
      [HEADER, row('2017-pt', '2017', 'pt', 'Salvador Sobral', 'Amar Pelos Dois')].join('\n'),
    );

    const [pt] = await getContestantsForYear('2017');
    expect(pt.finalsRank).toBeUndefined();
    expect(pt.contestRank).toBeUndefined();
    expect(pt.votes?.totalPoints).toBeUndefined();
  });

  it('caches results so a repeated fetch is not re-parsed', async () => {
    fetchContestantCsv.mockResolvedValue(
      [HEADER, row('2014-at', '2014', 'at', 'Conchita Wurst', 'Rise Like a Phoenix', '1')].join(
        '\n',
      ),
    );

    await getContestantsForYear('2014');
    await getContestantsForYear('2014');
    // second call served from the year cache
    expect(fetchContestantCsv).toHaveBeenCalledTimes(1);
  });
});

describe('getContestantsForYear — placements', () => {
  // Parsed contestants are cached by year for the life of the module, so each
  // case takes a fresh copy of the repository to parse its own CSV.
  const freshContestantsForYear = async (csv: string, year: string) => {
    fetchContestantCsv.mockResolvedValue(csv);
    vi.resetModules();
    const { getContestantsForYear: fresh } = await import('./ContestantRepository');
    return fresh(year);
  };

  // A year with semi-finals: place_contest orders the whole field, place_final
  // only the countries that reached the grand final.
  const SEMI_FINAL_YEAR = [
    HEADER,
    row('2009-fi', '2009', 'fi', "Waldo's People", 'Lose Control', '25', '25', '12', '22'),
    row('2009-no', '2009', 'no', 'Alexander Rybak', 'Fairytale', '1', '1', '1', '387'),
    row('2009-cz', '2009', 'cz', 'Gipsy.cz', 'Aven Romale', '42', '', '18'),
  ];

  it('reads the finals placement from place_final, not the whole-contest order', async () => {
    const contestants = await freshContestantsForYear(SEMI_FINAL_YEAR.join('\n'), '2009');
    const fi = contestants.find((c) => c.countryKey === 'fi')!;
    expect(fi.finalsRank).toBe(25);
    expect(fi.contestRank).toBe(25);
  });

  it('gives no finals placement to an entry eliminated in a semi-final', async () => {
    const contestants = await freshContestantsForYear(SEMI_FINAL_YEAR.join('\n'), '2009');
    const cz = contestants.find((c) => c.countryKey === 'cz')!;
    expect(cz.finalsRank).toBeUndefined();
    // still placed 42nd across the contest as a whole
    expect(cz.contestRank).toBe(42);
    expect(cz.semiFinalsRank).toBe(18);
  });

  it('treats place_contest as the finals placement when a year supplies no place_final', async () => {
    const contestants = await freshContestantsForYear(
      [
        HEADER,
        row('2024-ch', '2024', 'ch', 'Nemo', 'The Code', '1'),
        row('2024-no', '2024', 'no', 'Gåte', 'Ulveham', '25'),
        row('2024-cz', '2024', 'cz', 'Aiko', 'Pedestal'),
      ].join('\n'),
      '2024',
    );
    expect(contestants.find((c) => c.countryKey === 'ch')!.finalsRank).toBe(1);
    expect(contestants.find((c) => c.countryKey === 'no')!.finalsRank).toBe(25);
    expect(contestants.find((c) => c.countryKey === 'cz')!.finalsRank).toBeUndefined();
  });

  it('resolves placements per year when rows from several years are parsed together', async () => {
    // getContestantsByCountry and friends parse the whole CSV at once, so the
    // no-place_final fallback must not leak from one year into another.
    const contestants = await freshContestantsForYear(
      [...SEMI_FINAL_YEAR, row('2024-ch', '2024', 'ch', 'Nemo', 'The Code', '1')].join('\n'),
      '2009',
    );

    const cz = contestants.find((c) => c.countryKey === 'cz')!;
    expect(cz.finalsRank).toBeUndefined();
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
      ].join('\n'),
    );

    const ccs = await fetchCountryContestantsByYear('2015');

    // sorted alphabetically by country name: Australia, Belgium, Sweden
    expect(ccs.map((cc) => cc.country.name)).toEqual(['Australia', 'Belgium', 'Sweden']);
    const sweden = ccs.find((cc) => cc.country.key === 'se')!;
    expect(sweden.contestant?.artist).toBe('Måns Zelmerlöw');
    expect(sweden.id).toBe(sweden.country.id);
  });
});
