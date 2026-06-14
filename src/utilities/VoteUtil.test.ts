import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  getSourceCountryKey,
  hasAnyJuryVotes,
  hasAnyTeleVotes,
  getVoteTypeOptionsByYear,
  getVoteTypeOption,
  getVoteTypeCodeFromOption,
  getVoteCode,
  assignVotes,
} from './VoteUtil';
import { logger } from './logger';
import { CountryContestant } from '../data/CountryContestant';
import { Vote } from '../data/Vote';

vi.mock('./logger', () => ({
  logger: { error: vi.fn(), warn: vi.fn(), log: vi.fn(), info: vi.fn(), debug: vi.fn() },
}));

// Albania maps to key 'al' in the country table; used wherever a real lookup is needed.
function cc(overrides: Partial<CountryContestant> = {}): CountryContestant {
  return {
    id: 'al',
    country: { id: 'a', name: 'Albania', key: 'al', icon: 'flag-icon-al' },
    contestant: { year: '2018' } as CountryContestant['contestant'],
    ...overrides,
  } as CountryContestant;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSourceCountryKey', () => {
  it('returns undefined without logging when the source is empty or "All"', () => {
    expect(getSourceCountryKey('')).toBeUndefined();
    expect(getSourceCountryKey('All')).toBeUndefined();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('resolves a known country name to its key', () => {
    expect(getSourceCountryKey('Albania')).toBe('al');
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('logs an error for an unknown country name', () => {
    expect(getSourceCountryKey('Atlantis')).toBeUndefined();
    expect(logger.error).toHaveBeenCalledWith('Source country not found for Atlantis');
  });
});

describe('hasAnyJuryVotes / hasAnyTeleVotes', () => {
  const withJury = cc({
    contestant: { year: '2018', votes: { juryPoints: 5 } } as CountryContestant['contestant'],
  });
  const withTele = cc({
    contestant: { year: '2018', votes: { telePoints: 7 } } as CountryContestant['contestant'],
  });
  const withZero = cc({
    contestant: {
      year: '2018',
      votes: { juryPoints: 0, telePoints: 0 },
    } as CountryContestant['contestant'],
  });

  it('detects jury points only when a positive total is present', () => {
    expect(hasAnyJuryVotes([withJury])).toBe(true);
    expect(hasAnyJuryVotes([withTele])).toBeFalsy();
    expect(hasAnyJuryVotes([withZero])).toBeFalsy();
    expect(hasAnyJuryVotes([cc()])).toBeFalsy();
  });

  it('detects televote points only when a positive total is present', () => {
    expect(hasAnyTeleVotes([withTele])).toBe(true);
    expect(hasAnyTeleVotes([withJury])).toBeFalsy();
    expect(hasAnyTeleVotes([withZero])).toBeFalsy();
    expect(hasAnyTeleVotes([cc()])).toBeFalsy();
  });
});

describe('getVoteTypeOptionsByYear', () => {
  it('offers televote and jury breakdowns only from 2017 onward', () => {
    expect(getVoteTypeOptionsByYear('2017')).toEqual(['Total', 'Televote', 'Jury']);
  });

  it('offers only the total before the 2016 jury/tele split', () => {
    expect(getVoteTypeOptionsByYear('2016')).toEqual(['Total']);
    expect(getVoteTypeOptionsByYear('2010')).toEqual(['Total']);
  });
});

describe('getVoteTypeOption', () => {
  it('reports no vote type for empty or loading codes', () => {
    expect(getVoteTypeOption('')).toBe('None');
    expect(getVoteTypeOption('loading')).toBe('None');
  });

  it('maps the type segment of the code to a label', () => {
    expect(getVoteTypeOption('f-tv-gb')).toBe('Tele');
    expect(getVoteTypeOption('f-j')).toBe('Jury');
    expect(getVoteTypeOption('f-jury')).toBe('Jury');
    expect(getVoteTypeOption('f-t')).toBe('Total');
  });
});

describe('getVoteTypeCodeFromOption', () => {
  it('returns undefined for an empty or unrecognized option', () => {
    expect(getVoteTypeCodeFromOption('')).toBeUndefined();
    expect(getVoteTypeCodeFromOption('mystery')).toBeUndefined();
  });

  it('maps option labels back to their code, case-insensitively', () => {
    expect(getVoteTypeCodeFromOption('Jury')).toBe('j');
    expect(getVoteTypeCodeFromOption('Total')).toBe('t');
    expect(getVoteTypeCodeFromOption('Tele')).toBe('tv');
    expect(getVoteTypeCodeFromOption('Televote')).toBe('tv');
  });
});

describe('getVoteCode', () => {
  it('builds a round-type code without a source segment when source is "All"', () => {
    expect(getVoteCode('f', 'tv', 'All')).toBe('f-tv');
  });

  it('appends the resolved source country key when a source is given', () => {
    expect(getVoteCode('f', 'tv', 'Albania')).toBe('f-tv-al');
  });
});

describe('assignVotes', () => {
  const vote = (overrides: Partial<Vote> = {}): Vote => ({
    year: '2018',
    round: 'final',
    fromCountryKey: 'gb',
    toCountryKey: 'al',
    totalPoints: 5,
    ...overrides,
  });

  it('sums points per recipient and attaches them to the matching contestant', () => {
    const result = assignVotes(
      [cc()],
      [vote({ totalPoints: 5 }), vote({ totalPoints: 7 })],
    );
    expect(result[0].contestant?.votes?.totalPoints).toBe(12);
  });

  it('does not mutate the input contestants', () => {
    const input = [cc()];
    assignVotes(input, [vote()]);
    expect(input[0].contestant?.votes).toBeUndefined();
  });

  it('leaves a contestant without matching votes undefined', () => {
    const result = assignVotes([cc()], [vote({ toCountryKey: 'se' })]);
    expect(result[0].contestant?.votes).toBeUndefined();
  });

  it('reports 0 for a recipient with explicit zero points', () => {
    const result = assignVotes([cc()], [vote({ totalPoints: 0 })]);
    expect(result[0].contestant?.votes?.totalPoints).toBe(0);
  });

  it('leaves a blank (non-numeric) column undefined rather than 0', () => {
    const result = assignVotes(
      [cc()],
      [vote({ totalPoints: 3, juryPoints: undefined, telePoints: undefined })],
    );
    expect(result[0].contestant?.votes?.totalPoints).toBe(3);
    expect(result[0].contestant?.votes?.juryPoints).toBeUndefined();
    expect(result[0].contestant?.votes?.telePoints).toBeUndefined();
  });

  it('skips entries whose contestant is null', () => {
    const result = assignVotes([cc({ contestant: null })], [vote()]);
    expect(result[0].contestant).toBeNull();
  });
});
