import { Contestant } from '../data/Contestant';
import { CountryContestant } from '../data/CountryContestant';
import { Vote } from '../data/Vote';

const repo = vi.hoisted(() => ({
  fetchVotesForYear: vi.fn(),
  fetchVotesForYearsAndCountries: vi.fn(),
}));

vi.mock('./VoteRepository', () => repo);

/**
 * getVotes keeps a module level cache keyed by year and round, so each test
 * starts from a freshly evaluated module to keep that cache from leaking
 * between cases.
 */
async function loadVoteProcessor() {
  vi.resetModules();
  return import('./VoteProcessor');
}

function countryContestant(countryKey: string, year: string): CountryContestant {
  return {
    id: countryKey,
    country: { id: countryKey, name: countryKey.toUpperCase(), key: countryKey, icon: '' },
    contestant: new Contestant({
      id: `${countryKey}-${year}`,
      countryKey,
      artist: 'artist',
      song: 'song',
      year,
    }),
  };
}

function vote(
  toCountryKey: string,
  points: { total?: number; tele?: number; jury?: number },
  options: { year?: string; round?: string; fromCountryKey?: string } = {},
): Vote {
  return {
    year: options.year ?? '2023',
    round: options.round ?? 'final',
    fromCountryKey: options.fromCountryKey ?? 'se',
    toCountryKey,
    totalPoints: points.total,
    telePoints: points.tele,
    juryPoints: points.jury,
  };
}

beforeEach(() => {
  repo.fetchVotesForYear.mockReset().mockResolvedValue([]);
  repo.fetchVotesForYearsAndCountries.mockReset().mockResolvedValue([]);
});

describe('getVotes', () => {
  it('reuses the previously fetched records when the year and round are unchanged', async () => {
    const { getVotes } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([vote('gb', { total: 5 })]);

    await getVotes('2023', undefined, 'final');
    const second = await getVotes('2023', undefined, 'final');

    expect(repo.fetchVotesForYear).toHaveBeenCalledTimes(1);
    expect(second).toHaveLength(1);
  });

  it('fetches again when the round changes', async () => {
    const { getVotes } = await loadVoteProcessor();

    await getVotes('2023', undefined, 'final');
    await getVotes('2023', undefined, 'semi-final');

    expect(repo.fetchVotesForYear).toHaveBeenCalledTimes(2);
  });

  it('fetches again when the year changes', async () => {
    const { getVotes } = await loadVoteProcessor();

    await getVotes('2023', undefined, 'final');
    await getVotes('2022', undefined, 'final');

    expect(repo.fetchVotesForYear).toHaveBeenCalledTimes(2);
  });

  it('returns only the records cast by the requested source country', async () => {
    const { getVotes } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([
      vote('gb', { total: 5 }, { fromCountryKey: 'se' }),
      vote('gb', { total: 8 }, { fromCountryKey: 'no' }),
    ]);

    const result = await getVotes('2023', 'no', 'final');

    expect(result).toEqual([expect.objectContaining({ fromCountryKey: 'no', totalPoints: 8 })]);
  });
});

describe('sortByVotes', () => {
  const contestants = [
    countryContestant('gb', '2023'),
    countryContestant('se', '2023'),
    countryContestant('no', '2023'),
  ];

  it('orders contestants by total points from highest to lowest', async () => {
    const { sortByVotes } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([
      vote('gb', { total: 10 }),
      vote('se', { total: 30 }),
      vote('no', { total: 20 }),
    ]);

    const result = await sortByVotes(contestants, 't');

    expect(result.map((cc) => cc.country.key)).toEqual(['se', 'no', 'gb']);
  });

  it('orders by televote points when the televote type is requested', async () => {
    const { sortByVotes } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([
      vote('gb', { total: 100, tele: 1 }),
      vote('se', { total: 1, tele: 50 }),
      vote('no', { total: 50, tele: 25 }),
    ]);

    const result = await sortByVotes(contestants, 'tv');

    expect(result.map((cc) => cc.country.key)).toEqual(['se', 'no', 'gb']);
  });

  it('orders by jury points when the jury type is requested', async () => {
    const { sortByVotes } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([
      vote('gb', { jury: 12 }),
      vote('se', { jury: 3 }),
      vote('no', { jury: 7 }),
    ]);

    const result = await sortByVotes(contestants, 'jury');

    expect(result.map((cc) => cc.country.key)).toEqual(['gb', 'no', 'se']);
  });

  it('keeps contestants the source country gave no points to out of the result', async () => {
    const { sortByVotes } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([
      vote('gb', { total: 12 }, { fromCountryKey: 'dk' }),
      vote('se', { total: 0 }, { fromCountryKey: 'dk' }),
    ]);

    const result = await sortByVotes(contestants, 't', 'final', 'dk');

    expect(result.map((cc) => cc.country.key)).toEqual(['gb']);
  });

  it('keeps contestants without any points when no source country is given', async () => {
    const { sortByVotes } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([vote('gb', { total: 12 })]);

    const result = await sortByVotes(contestants, 't');

    expect(result).toHaveLength(3);
    expect(result[0]!.country.key).toBe('gb');
  });

  it('looks up each year separately when the ranking spans multiple contests', async () => {
    const { sortByVotes } = await loadVoteProcessor();
    const multiYear = [countryContestant('gb', '2023'), countryContestant('se', '2018')];
    repo.fetchVotesForYearsAndCountries.mockResolvedValue([
      vote('gb', { total: 4 }, { year: '2023' }),
      vote('se', { total: 9 }, { year: '2018' }),
    ]);

    const result = await sortByVotes(multiYear, 't');

    expect(repo.fetchVotesForYearsAndCountries).toHaveBeenCalledWith(
      [
        { year: '2023', countryKey: 'gb' },
        { year: '2018', countryKey: 'se' },
      ],
      'final',
    );
    expect(result.map((cc) => cc.country.key)).toEqual(['se', 'gb']);
  });

  it('narrows a multi year ranking to the requested source country', async () => {
    const { sortByVotes } = await loadVoteProcessor();
    const multiYear = [countryContestant('gb', '2023'), countryContestant('se', '2018')];
    repo.fetchVotesForYearsAndCountries.mockResolvedValue([
      vote('gb', { total: 4 }, { year: '2023', fromCountryKey: 'dk' }),
      vote('se', { total: 9 }, { year: '2018', fromCountryKey: 'no' }),
    ]);

    const result = await sortByVotes(multiYear, 't', 'final', 'dk');

    expect(result.map((cc) => cc.country.key)).toEqual(['gb']);
  });

  it('rejects a round that is not part of the contest', async () => {
    const { sortByVotes } = await loadVoteProcessor();

    await expect(sortByVotes(contestants, 't', 'quarter-final')).rejects.toThrow(
      /Invalid round "quarter-final"/,
    );
  });

  it('accepts contest rounds regardless of the casing used', async () => {
    const { sortByVotes } = await loadVoteProcessor();

    await sortByVotes(contestants, 't', 'Semi-Final-2');

    expect(repo.fetchVotesForYear).toHaveBeenCalledWith('2023', undefined, 'semi-final-2');
  });
});

describe('assignVotesByCode', () => {
  it('applies the points the code describes to each contestant', async () => {
    const { assignVotesByCode } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([vote('gb', { total: 15, tele: 10, jury: 5 })]);

    const result = await assignVotesByCode([countryContestant('gb', '2023')], 'f-t');

    expect(repo.fetchVotesForYear).toHaveBeenCalledWith('2023', undefined, 'final', undefined);
    expect(result[0]!.contestant!.votes).toMatchObject({
      totalPoints: 15,
      telePoints: 10,
      juryPoints: 5,
    });
  });

  it('reads the source country out of the code', async () => {
    const { assignVotesByCode } = await loadVoteProcessor();

    await assignVotesByCode([countryContestant('gb', '2023')], 'sf-tv-dk');

    expect(repo.fetchVotesForYear).toHaveBeenCalledWith('2023', 'dk', 'semi-final', undefined);
  });

  it('falls back to the final when the code names an unknown round', async () => {
    const { assignVotesByCode } = await loadVoteProcessor();

    await assignVotesByCode([countryContestant('gb', '2023')], 'x-t');

    expect(repo.fetchVotesForYear).toHaveBeenCalledWith('2023', undefined, 'final', undefined);
  });

  it('looks up every year in a multi year ranking and honours the source country', async () => {
    const { assignVotesByCode } = await loadVoteProcessor();
    repo.fetchVotesForYearsAndCountries.mockResolvedValue([
      vote('gb', { total: 4 }, { year: '2023', fromCountryKey: 'dk' }),
      vote('se', { total: 9 }, { year: '2018', fromCountryKey: 'no' }),
    ]);

    const result = await assignVotesByCode(
      [countryContestant('gb', '2023'), countryContestant('se', '2018')],
      'f-t-dk',
    );

    expect(repo.fetchVotesForYearsAndCountries).toHaveBeenCalledWith(
      [
        { year: '2023', countryKey: 'gb' },
        { year: '2018', countryKey: 'se' },
      ],
      'final',
    );
    expect(result[0]!.contestant!.votes).toMatchObject({ totalPoints: 4 });
    expect(result[1]!.contestant!.votes).toBeUndefined();
  });
});

describe('assignVotesByContestants', () => {
  it('applies only the points the coded source country awarded', async () => {
    const { assignVotesByContestants } = await loadVoteProcessor();
    repo.fetchVotesForYear.mockResolvedValue([
      vote('gb', { total: 6 }, { round: 'semi-final', fromCountryKey: 'dk' }),
      vote('gb', { total: 10 }, { round: 'semi-final', fromCountryKey: 'no' }),
    ]);

    const result = await assignVotesByContestants([countryContestant('gb', '2023')], 'sf-t-dk');

    expect(repo.fetchVotesForYear).toHaveBeenCalledWith('2023', undefined, 'semi-final');
    expect(result[0]!.contestant!.votes).toMatchObject({ totalPoints: 6 });
  });
});

describe('fetchVotesByCode', () => {
  it('passes the recipient country through to the lookup', async () => {
    const { fetchVotesByCode } = await loadVoteProcessor();
    const votes = [vote('gb', { total: 12 })];
    repo.fetchVotesForYear.mockResolvedValue(votes);

    const result = await fetchVotesByCode('f-t-dk', '2023', 'gb');

    expect(repo.fetchVotesForYear).toHaveBeenCalledWith('2023', 'dk', 'final', 'gb');
    expect(result).toBe(votes);
  });
});

describe('voteCodeHasAnyType', () => {
  it.each(['f-t', 'f-tv-gb', 'f-j.tv', 'f-j'])('recognises a vote type in %s', async (code) => {
    const { voteCodeHasAnyType } = await loadVoteProcessor();
    expect(voteCodeHasAnyType(code)).toBe(true);
  });

  it('reports no vote type for a code that only names a round', async () => {
    const { voteCodeHasAnyType } = await loadVoteProcessor();
    expect(voteCodeHasAnyType('f')).toBe(false);
  });
});

describe('updateVoteTypeCode', () => {
  it('returns an empty code when removing a type from nothing', async () => {
    const { updateVoteTypeCode } = await loadVoteProcessor();
    expect(updateVoteTypeCode(undefined, 'tv', false)).toBe('');
  });

  it('starts a final round code when adding a type to nothing', async () => {
    const { updateVoteTypeCode } = await loadVoteProcessor();
    expect(updateVoteTypeCode(undefined, 'tv', true)).toBe('f-tv');
  });

  it('leaves an already present type untouched', async () => {
    const { updateVoteTypeCode } = await loadVoteProcessor();
    expect(updateVoteTypeCode('f-tv.j', 'tv', true)).toBe('f-tv.j');
  });

  it('keeps the source country when a type is added', async () => {
    const { updateVoteTypeCode } = await loadVoteProcessor();
    expect(updateVoteTypeCode('f-j-gb', 'tv', true)).toBe('f-j.tv-gb');
  });

  it('drops the type section once the last type is removed', async () => {
    const { updateVoteTypeCode } = await loadVoteProcessor();
    expect(updateVoteTypeCode('f-tv', 'tv', false)).toBe('f');
  });
});
