import { defaultYear } from '../data/Contestants';

/**
 * The cache lives at module scope, so every test starts from a freshly
 * evaluated module and a fresh fetch spy.
 */
async function loadCsvCache() {
  vi.resetModules();
  return import('./CsvCache');
}

const fetchMock = vi.fn();

function csvResponse(body: string) {
  return { text: async () => body } as Response;
}

beforeEach(() => {
  fetchMock.mockReset().mockImplementation(async (url: string) => csvResponse(`body:${url}`));
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const requestedFiles = () => fetchMock.mock.calls.map(([url]) => String(url).split('/').pop());

describe('fetchVoteCsv', () => {
  it('reads the current contest votes from their own file', async () => {
    const { fetchVoteCsv } = await loadCsvCache();

    await fetchVoteCsv(defaultYear);

    expect(requestedFiles()).toEqual(['votesCurrent.csv']);
  });

  it('reads votes from past contests from the archive', async () => {
    const { fetchVoteCsv } = await loadCsvCache();

    await fetchVoteCsv('2018');

    expect(requestedFiles()).toEqual(['votes.csv']);
  });

  it('downloads the archive only once however many years are asked for', async () => {
    const { fetchVoteCsv } = await loadCsvCache();

    const first = await fetchVoteCsv('2018');
    const second = await fetchVoteCsv('2016');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  it('downloads the current contest votes only once', async () => {
    const { fetchVoteCsv } = await loadCsvCache();

    await fetchVoteCsv(defaultYear);
    await fetchVoteCsv(defaultYear);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('keeps the current contest separate from the archive', async () => {
    const { fetchVoteCsv } = await loadCsvCache();

    await fetchVoteCsv('2018');
    await fetchVoteCsv(defaultYear);

    expect(requestedFiles()).toEqual(['votes.csv', 'votesCurrent.csv']);
  });
});

describe('fetchContestantCsv', () => {
  it('reads only the current contest file when that year is asked for', async () => {
    const { fetchContestantCsv } = await loadCsvCache();

    await fetchContestantCsv(defaultYear);

    expect(requestedFiles()).toEqual(['mainCurrent.csv']);
  });

  it('joins the archive and the current contest for any other year', async () => {
    const { fetchContestantCsv } = await loadCsvCache();
    fetchMock.mockImplementation(async (url: string) =>
      csvResponse(String(url).endsWith('main.csv') ? 'archive\n' : 'current\n'),
    );

    const result = await fetchContestantCsv('2018');

    expect(requestedFiles()).toEqual(['main.csv', 'mainCurrent.csv']);
    expect(result).toBe('archive\ncurrent\n');
  });

  it('covers every year by default', async () => {
    const { fetchContestantCsv } = await loadCsvCache();

    await fetchContestantCsv();

    expect(requestedFiles()).toEqual(['main.csv', 'mainCurrent.csv']);
  });

  it('downloads each contestant file only once', async () => {
    const { fetchContestantCsv } = await loadCsvCache();

    const first = await fetchContestantCsv('2018');
    const second = await fetchContestantCsv('2016');

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(second).toBe(first);
  });

  it('serves the current contest from the full download already made', async () => {
    const { fetchContestantCsv } = await loadCsvCache();

    await fetchContestantCsv('2018');
    await fetchContestantCsv(defaultYear);

    expect(requestedFiles()).toEqual(['main.csv', 'mainCurrent.csv']);
  });
});

describe('fetchLyricsCsv', () => {
  it('reads the lyrics file', async () => {
    const { fetchLyricsCsv } = await loadCsvCache();

    await fetchLyricsCsv();

    expect(requestedFiles()).toEqual(['lyrics.csv']);
  });

  it('downloads the lyrics only once', async () => {
    const { fetchLyricsCsv } = await loadCsvCache();

    const first = await fetchLyricsCsv();
    const second = await fetchLyricsCsv();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });
});

describe('separate contests', () => {
  it('reads the Asia contest from its own file', async () => {
    const { fetchContestantCsv } = await loadCsvCache();

    await fetchContestantCsv('2026', 'asia');

    expect(requestedFiles()).toEqual(['asia.csv']);
  });

  it('never reads the Asia file for the traditional contest', async () => {
    const { fetchContestantCsv } = await loadCsvCache();

    await fetchContestantCsv(defaultYear);
    await fetchContestantCsv('2018');
    await fetchContestantCsv();

    expect(requestedFiles()).not.toContain('asia.csv');
  });

  it('keeps the same year of two contests apart', async () => {
    const { fetchContestantCsv } = await loadCsvCache();
    fetchMock.mockImplementation(async (url: string) =>
      csvResponse(String(url).endsWith('asia.csv') ? 'asia\n' : 'esc\n'),
    );

    const esc = await fetchContestantCsv('2026', 'esc');
    const asia = await fetchContestantCsv('2026', 'asia');

    expect(esc).toBe('esc\n');
    expect(asia).toBe('asia\n');
  });

  it('reports no votes for a contest without results, without downloading anything', async () => {
    const { fetchVoteCsv } = await loadCsvCache();

    expect(await fetchVoteCsv('2026', 'asia')).toBe('');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reads Asia lyrics from their own file', async () => {
    const { fetchLyricsCsv } = await loadCsvCache();

    await fetchLyricsCsv('asia');

    expect(requestedFiles()).toEqual(['lyricsAsia.csv']);
  });
});
