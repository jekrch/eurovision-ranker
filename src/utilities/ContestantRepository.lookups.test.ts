// @vitest-environment jsdom
export {};

const csvCache = vi.hoisted(() => ({
  fetchContestantCsv: vi.fn(),
  fetchVoteCsv: vi.fn(),
  fetchLyricsCsv: vi.fn(),
}));

vi.mock('./CsvCache', () => csvCache);
vi.mock('./VoteProcessor', () => ({
  assignVotesByContestants: (ccs: unknown) => Promise.resolve(ccs),
}));

/** Contestants are cached at module scope, so each test re-evaluates it. */
async function loadRepository() {
  vi.resetModules();
  return import('./ContestantRepository');
}

const HEADER =
  'id,year,to_country,to_country_id,performer,song,youtube_url,place_contest,place_final,place_sf,points_final,points_tele_final,points_jury_final,composers,lyricists';

const row = ({
  id,
  year,
  country = '',
  countryKey,
  performer = 'performer',
  song = 'song',
  placeContest = '',
  placeFinal = '',
  placeSf = '',
  composers = '',
  lyricists = '',
}: {
  id: string;
  year: string;
  country?: string;
  countryKey: string;
  performer?: string;
  song?: string;
  placeContest?: string;
  placeFinal?: string;
  placeSf?: string;
  composers?: string;
  lyricists?: string;
}) =>
  `${id},${year},${country},${countryKey},${performer},${song},,${placeContest},${placeFinal},${placeSf},,,,${composers},${lyricists}`;

const csv = (...rows: string[]) => [HEADER, ...rows].join('\n');

beforeEach(() => {
  csvCache.fetchContestantCsv.mockReset().mockResolvedValue(csv());
  csvCache.fetchLyricsCsv.mockReset().mockResolvedValue('id,lyrics,eng_lyrics');
});

describe('getContestantsByUids', () => {
  it('finds each requested contestant', async () => {
    const { getContestantsByUids } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({ id: '2023-se', year: '2023', countryKey: 'se', performer: 'Loreen' }),
        row({ id: '2018-gb', year: '2018', countryKey: 'gb', performer: 'SuRie' }),
        row({ id: '2015-au', year: '2015', countryKey: 'au', performer: 'Guy Sebastian' }),
      ),
    );

    const contestants = await getContestantsByUids(['2023-se', '2018-gb']);

    expect(contestants.map((c) => c.artist)).toEqual(['Loreen', 'SuRie']);
  });

  it('reads the source data only once for contestants already looked up', async () => {
    const { getContestantsByUids } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(row({ id: '2023-se', year: '2023', countryKey: 'se' })),
    );

    await getContestantsByUids(['2023-se']);
    const second = await getContestantsByUids(['2023-se']);

    expect(csvCache.fetchContestantCsv).toHaveBeenCalledTimes(1);
    expect(second.map((c) => c.id)).toEqual(['2023-se']);
  });

  it('looks up only the contestants it has not seen before', async () => {
    const { getContestantsByUids } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({ id: '2023-se', year: '2023', countryKey: 'se', performer: 'Loreen' }),
        row({ id: '2018-gb', year: '2018', countryKey: 'gb', performer: 'SuRie' }),
      ),
    );

    await getContestantsByUids(['2023-se']);
    const both = await getContestantsByUids(['2023-se', '2018-gb']);

    expect(csvCache.fetchContestantCsv).toHaveBeenCalledTimes(2);
    expect(both.map((c) => c.artist).sort()).toEqual(['Loreen', 'SuRie']);
  });

  it('finds nobody when asked for nobody', async () => {
    const { getContestantsByUids } = await loadRepository();

    await expect(getContestantsByUids([])).resolves.toEqual([]);
    expect(csvCache.fetchContestantCsv).not.toHaveBeenCalled();
  });
});

describe('getCountryContestantsByUids', () => {
  it('returns the contestants in the order they were ranked', async () => {
    const { getCountryContestantsByUids } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({ id: '2023-se', year: '2023', countryKey: 'se' }),
        row({ id: '2018-gb', year: '2018', countryKey: 'gb' }),
        row({ id: '2015-au', year: '2015', countryKey: 'au' }),
      ),
    );

    const ccs = await getCountryContestantsByUids(['2018-gb', '2015-au', '2023-se'], '');

    expect(ccs.map((cc) => cc.uid)).toEqual(['2018-gb', '2015-au', '2023-se']);
  });

  it('joins each contestant to the country that sent them', async () => {
    const { getCountryContestantsByUids } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(row({ id: '2023-se', year: '2023', countryKey: 'se' })),
    );

    const [cc] = await getCountryContestantsByUids(['2023-se'], '');

    expect(cc!.country.name).toBe('Sweden');
  });

  it('leaves out a ranked entry the data no longer holds', async () => {
    const { getCountryContestantsByUids } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(row({ id: '2023-se', year: '2023', countryKey: 'se' })),
    );

    const ccs = await getCountryContestantsByUids(['2023-se', '1999-zz'], '');

    expect(ccs.map((cc) => cc.uid)).toEqual(['2023-se']);
  });
});

describe('getContestantsByCountry', () => {
  it('finds every contest a country took part in', async () => {
    const { getContestantsByCountry } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({ id: '2023-se', year: '2023', country: 'Sweden', countryKey: 'se' }),
        row({ id: '2015-se', year: '2015', country: 'Sweden', countryKey: 'se' }),
        row({ id: '2018-gb', year: '2018', country: 'United Kingdom', countryKey: 'gb' }),
      ),
    );

    const contestants = await getContestantsByCountry('Sweden');

    expect(contestants.map((c) => c.year)).toEqual(['2023', '2015']);
  });

  it('recognises a country whatever case it is given in', async () => {
    const { getContestantsByCountry } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(row({ id: '2023-se', year: '2023', country: 'Sweden', countryKey: 'se' })),
    );

    await expect(getContestantsByCountry('sWeDeN')).resolves.toHaveLength(1);
  });

  it('finds nothing when no country is named', async () => {
    const { getContestantsByCountry } = await loadRepository();

    await expect(getContestantsByCountry('')).resolves.toEqual([]);
    expect(csvCache.fetchContestantCsv).not.toHaveBeenCalled();
  });
});

describe('getSongDetails', () => {
  it('reports the song credits and its lyrics', async () => {
    const { getSongDetails } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({
          id: '2023-se',
          year: '2023',
          countryKey: 'se',
          composers: 'a composer',
          lyricists: 'a lyricist',
        }),
      ),
    );
    csvCache.fetchLyricsCsv.mockResolvedValue(
      ['id,lyrics,eng_lyrics', '2023-se,original words,english words'].join('\n'),
    );

    await expect(getSongDetails('2023-se')).resolves.toEqual({
      lyrics: 'original words',
      engLyrics: 'english words',
      composers: 'a composer',
      lyricists: 'a lyricist',
    });
  });

  it('reports the credits of a song whose lyrics are not transcribed', async () => {
    const { getSongDetails } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(row({ id: '2023-se', year: '2023', countryKey: 'se', composers: 'a composer' })),
    );

    await expect(getSongDetails('2023-se')).resolves.toMatchObject({
      lyrics: '',
      engLyrics: '',
      composers: 'a composer',
    });
  });

  it('still reports the credits when the lyrics cannot be loaded', async () => {
    const { getSongDetails } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(row({ id: '2023-se', year: '2023', countryKey: 'se', composers: 'a composer' })),
    );
    csvCache.fetchLyricsCsv.mockRejectedValue(new Error('offline'));

    await expect(getSongDetails('2023-se')).resolves.toMatchObject({
      lyrics: '',
      composers: 'a composer',
    });
  });

  it('looks beyond the current contest when the song is from an earlier one', async () => {
    const { getSongDetails } = await loadRepository();
    csvCache.fetchContestantCsv.mockImplementation(async (year: string) =>
      year === '2026'
        ? csv()
        : csv(row({ id: '2018-gb', year: '2018', countryKey: 'gb', composers: 'a composer' })),
    );

    await expect(getSongDetails('2018-gb', '2026')).resolves.toMatchObject({
      composers: 'a composer',
    });
  });

  it('reports nothing for a song that is not in the data', async () => {
    const { getSongDetails } = await loadRepository();

    await expect(getSongDetails('1999-zz')).resolves.toBeUndefined();
  });

  it('reports nothing for a song missing from both the year and the archive', async () => {
    const { getSongDetails } = await loadRepository();

    await expect(getSongDetails('1999-zz', '2026')).resolves.toBeUndefined();
  });
});

describe('contests where a country entered twice', () => {
  it('keeps both of a country 1956 entries', async () => {
    const { getContestantsForYear } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({ id: '1956-ch', year: '1956', countryKey: 'ch', song: 'first song' }),
        row({ id: '1956-ch', year: '1956', countryKey: 'ch', song: 'second song' }),
      ),
    );

    const contestants = await getContestantsForYear('1956');

    expect(contestants.map((c) => c.song)).toEqual(['first song', 'second song']);
    expect(contestants.map((c) => c.countryKey)).toEqual(['ch', 'ch-2']);
  });

  it('shows the second 1956 entry as its own country listing', async () => {
    const { fetchCountryContestantsByYear } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({ id: '1956-ch', year: '1956', countryKey: 'ch', song: 'first song' }),
        row({ id: '1956-ch', year: '1956', countryKey: 'ch', song: 'second song' }),
      ),
    );

    const ccs = await fetchCountryContestantsByYear('1956');

    expect(ccs.map((cc) => cc.country.name)).toEqual(['Switzerland', 'Switzerland (2)']);
  });

  it('merges a later contest duplicate row into the entry it already has', async () => {
    const { getContestantsForYear } = await loadRepository();
    csvCache.fetchContestantCsv.mockResolvedValue(
      csv(
        row({ id: '2023-se', year: '2023', countryKey: 'se', placeSf: '' }),
        row({ id: '2023-se', year: '2023', countryKey: 'se', placeContest: '1', placeSf: '2' }),
      ),
    );

    const contestants = await getContestantsForYear('2023');

    expect(contestants).toHaveLength(1);
    expect(contestants[0]).toMatchObject({ contestRank: 1, semiFinalsRank: 2 });
  });
});
