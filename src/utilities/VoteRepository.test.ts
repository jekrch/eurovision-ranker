export {};

const csvCache = vi.hoisted(() => ({
  fetchVoteCsv: vi.fn(),
  fetchContestantCsv: vi.fn(),
  fetchLyricsCsv: vi.fn(),
}));

vi.mock('./CsvCache', () => csvCache);

/** Parsed votes are cached at module scope, so each test re-evaluates it. */
async function loadVoteRepository() {
  vi.resetModules();
  return import('./VoteRepository');
}

const header = 'year,round,from_country_id,to_country_id,total_points,tele_points,jury_points';

const csv = (...rows: string[]) => [header, ...rows].join('\n');

const votesCsv = csv(
  '2023,f,se,gb,12,6,6',
  '2023,f,no,gb,8,4,4',
  '2023,f,se,no,10,5,5',
  '2023,sf,se,gb,7,3,4',
  '2018,f,se,gb,5,,',
);

beforeEach(() => {
  csvCache.fetchVoteCsv.mockReset().mockResolvedValue(votesCsv);
});

describe('fetchVotesForYear', () => {
  it('returns every vote cast in the requested contest', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const votes = await fetchVotesForYear('2023');

    expect(votes).toHaveLength(4);
    expect(votes.every((v) => v.year === '2023')).toBe(true);
  });

  it('understands a two digit contest year', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const votes = await fetchVotesForYear('23');

    expect(votes.every((v) => v.year === '2023')).toBe(true);
  });

  it('returns only the votes cast by the given country', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const votes = await fetchVotesForYear('2023', 'se');

    expect(votes.map((v) => v.toCountryKey)).toEqual(['gb', 'no', 'gb']);
  });

  it('recognises a source country whatever case it is given in', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const votes = await fetchVotesForYear('2023', 'SE');

    expect(votes).toHaveLength(3);
  });

  it('returns only the votes cast in the given round', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const votes = await fetchVotesForYear('2023', undefined, 'semi-final');

    expect(votes).toEqual([expect.objectContaining({ round: 'Semi-Final', totalPoints: 7 })]);
  });

  it('returns only the votes a given country received', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const votes = await fetchVotesForYear('2023', undefined, 'final', 'no');

    expect(votes).toEqual([expect.objectContaining({ fromCountryKey: 'se', toCountryKey: 'no' })]);
  });

  it('reports each point total that was awarded', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const [vote] = await fetchVotesForYear('2023', 'se', 'final', 'gb');

    expect(vote).toMatchObject({
      year: '2023',
      round: 'Final',
      fromCountryKey: 'se',
      toCountryKey: 'gb',
      totalPoints: 12,
      telePoints: 6,
      juryPoints: 6,
    });
  });

  it('reports no points for a contest that did not split the vote', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const [vote] = await fetchVotesForYear('2018');

    expect(vote).toMatchObject({ totalPoints: 5, telePoints: 0, juryPoints: 0 });
  });

  it('reads the source data only once for a repeated question', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    await fetchVotesForYear('2023', 'se', 'final');
    await fetchVotesForYear('2023', 'se', 'final');

    expect(csvCache.fetchVoteCsv).toHaveBeenCalledTimes(1);
  });

  it('answers a question about a different recipient separately', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    const toGb = await fetchVotesForYear('2023', 'se', 'final', 'gb');
    const toNo = await fetchVotesForYear('2023', 'se', 'final', 'no');

    expect(toGb.map((v) => v.toCountryKey)).toEqual(['gb']);
    expect(toNo.map((v) => v.toCountryKey)).toEqual(['no']);
  });

  it('rejects a round that is not part of the contest', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();

    expect(() => fetchVotesForYear('2023', undefined, 'quarter-final')).toThrow(/not supported/);
  });

  it('reports source data holding a round it cannot read', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();
    csvCache.fetchVoteCsv.mockResolvedValue(csv('2023,xf,se,gb,12,6,6'));

    await expect(fetchVotesForYear('2023')).rejects.toThrow(/not supported/);
  });

  it('reports source data it cannot read at all', async () => {
    const { fetchVotesForYear } = await loadVoteRepository();
    csvCache.fetchVoteCsv.mockRejectedValue(new Error('offline'));

    await expect(fetchVotesForYear('2023')).rejects.toThrow('offline');
  });
});

describe('fetchVotesForYearsAndCountries', () => {
  it('collects the votes each ranked entry received in its own contest', async () => {
    const { fetchVotesForYearsAndCountries } = await loadVoteRepository();

    const votes = await fetchVotesForYearsAndCountries(
      [
        { year: '2023', countryKey: 'gb' },
        { year: '2018', countryKey: 'gb' },
      ],
      'final',
    );

    expect(votes).toHaveLength(3);
    expect(votes.every((v) => v.toCountryKey === 'gb')).toBe(true);
  });

  it('leaves out contests nobody in the ranking took part in', async () => {
    const { fetchVotesForYearsAndCountries } = await loadVoteRepository();

    const votes = await fetchVotesForYearsAndCountries([{ year: '2018', countryKey: 'gb' }]);

    expect(votes.map((v) => v.year)).toEqual(['2018']);
  });

  it('recognises a recipient whatever case it is given in', async () => {
    const { fetchVotesForYearsAndCountries } = await loadVoteRepository();

    const votes = await fetchVotesForYearsAndCountries(
      [{ year: '2023', countryKey: 'GB' }],
      'final',
    );

    expect(votes).toHaveLength(2);
  });

  it('returns only the votes cast in the given round', async () => {
    const { fetchVotesForYearsAndCountries } = await loadVoteRepository();

    const votes = await fetchVotesForYearsAndCountries(
      [{ year: '2023', countryKey: 'gb' }],
      'semi-final',
    );

    expect(votes).toEqual([expect.objectContaining({ round: 'Semi-Final' })]);
  });

  it('reads the source data only once for a repeated question', async () => {
    const { fetchVotesForYearsAndCountries } = await loadVoteRepository();
    const pairs = [{ year: '2023', countryKey: 'gb' }];

    await fetchVotesForYearsAndCountries(pairs, 'final');
    await fetchVotesForYearsAndCountries(pairs, 'final');

    expect(csvCache.fetchVoteCsv).toHaveBeenCalledTimes(1);
  });

  it('rejects a round that is not part of the contest', async () => {
    const { fetchVotesForYearsAndCountries } = await loadVoteRepository();

    await expect(
      fetchVotesForYearsAndCountries([{ year: '2023', countryKey: 'gb' }], 'quarter-final'),
    ).rejects.toThrow(/not supported/);
  });
});

describe('fetchDistinctFromCountryIdsForYear', () => {
  it('lists each country that voted in the contest once', async () => {
    const { fetchDistinctFromCountryIdsForYear } = await loadVoteRepository();
    const fetchMock = vi.fn().mockResolvedValue({ text: async () => votesCsv } as Response);
    vi.stubGlobal('fetch', fetchMock);

    const ids = await fetchDistinctFromCountryIdsForYear('2023');

    expect(ids).toEqual(['se', 'no']);
    vi.unstubAllGlobals();
  });

  it('reports source data it cannot read', async () => {
    const { fetchDistinctFromCountryIdsForYear } = await loadVoteRepository();
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

    await expect(fetchDistinctFromCountryIdsForYear('2023')).rejects.toThrow('offline');
    vi.unstubAllGlobals();
  });
});

describe('fetchVoteRoundSummariesForYear', () => {
  it('lists the rounds with votes, final first, with their voters and vote types', async () => {
    const { fetchVoteRoundSummariesForYear } = await loadVoteRepository();
    csvCache.fetchVoteCsv.mockResolvedValue(
      csv(
        '2019,sf2,se,gb,7,,',
        '2019,sf1,dk,no,5,5,0',
        '2019,f,se,gb,12,6,6',
        '2019,f,no,gb,8,4,4',
        '2018,sf,se,gb,5,,',
      ),
    );

    const summaries = await fetchVoteRoundSummariesForYear('19');

    expect(summaries).toEqual([
      {
        round: 'final',
        fromCountryKeys: ['se', 'no'],
        hasTeleVotes: true,
        hasJuryVotes: true,
      },
      { round: 'semi-final-1', fromCountryKeys: ['dk'], hasTeleVotes: true, hasJuryVotes: false },
      { round: 'semi-final-2', fromCountryKeys: ['se'], hasTeleVotes: false, hasJuryVotes: false },
    ]);
  });

  it('returns no rounds for a year without vote data', async () => {
    const { fetchVoteRoundSummariesForYear } = await loadVoteRepository();

    expect(await fetchVoteRoundSummariesForYear('1956')).toEqual([]);
  });
});
