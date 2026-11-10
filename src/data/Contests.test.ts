import { defaultYear } from './Contestants';
import {
  contestYearOptions,
  contests,
  formatContestYear,
  sanitizeContest,
  sanitizeYear,
} from './Contests';

describe('sanitizeContest', () => {
  it('treats a missing contest as the traditional contest', () => {
    expect(sanitizeContest(null)).toBe('esc');
    expect(sanitizeContest(undefined)).toBe('esc');
    expect(sanitizeContest('')).toBe('esc');
  });

  it('recognizes the Asia contest regardless of casing', () => {
    expect(sanitizeContest('asia')).toBe('asia');
    expect(sanitizeContest('ASIA')).toBe('asia');
  });

  it('falls back to the traditional contest for an unknown contest', () => {
    expect(sanitizeContest('junior')).toBe('esc');
    expect(sanitizeContest('constructor')).toBe('esc');
  });
});

describe('sanitizeYear', () => {
  it('expands two-digit years for the traditional contest', () => {
    expect(sanitizeYear('18')).toBe('2018');
    expect(sanitizeYear('56')).toBe('1956');
  });

  it('defaults to the current traditional contest without a year', () => {
    expect(sanitizeYear(null)).toBe(defaultYear);
    expect(sanitizeYear('')).toBe(defaultYear);
  });

  it('expands two-digit years for the Asia contest', () => {
    expect(sanitizeYear('26', 'asia')).toBe('2026');
  });

  it('falls back to the Asia default for a year the Asia contest never held', () => {
    expect(sanitizeYear('18', 'asia')).toBe(contests.asia.defaultYear);
    expect(sanitizeYear(null, 'asia')).toBe(contests.asia.defaultYear);
  });
});

describe('formatContestYear', () => {
  it('shows only the year for the traditional contest', () => {
    expect(formatContestYear('esc', '2026')).toBe('2026');
  });

  it('names any other contest alongside the year', () => {
    expect(formatContestYear('asia', 2026)).toBe('Asia 2026');
  });
});

describe('contest registry', () => {
  it('loads the traditional contest from its own files only', () => {
    const files = [
      ...contests.esc.contestantFiles(defaultYear),
      ...contests.esc.contestantFiles('2018'),
      ...contests.esc.contestantFiles(''),
    ];
    expect(files).not.toContain('asia.csv');
  });

  it('loads the Asia contest from its own file only', () => {
    expect(contests.asia.contestantFiles('2026')).toEqual(['asia.csv']);
    expect(contests.asia.contestantFiles('')).toEqual(['asia.csv']);
  });

  it('lists each contest default year among its years', () => {
    Object.values(contests).forEach((contest) => {
      expect(contest.years).toContain(contest.defaultYear);
    });
  });
});

describe('contestYearOptions', () => {
  it('lists the Asia contest directly under the matching traditional year', () => {
    const labels = contestYearOptions().map((o) => o.label);
    const escIndex = labels.indexOf('2026');
    expect(escIndex).toBeGreaterThanOrEqual(0);
    expect(labels[escIndex + 1]).toBe('Asia 2026');
  });

  it('includes every year of every contest exactly once', () => {
    const options = contestYearOptions();
    const expected = Object.values(contests).reduce((n, def) => n + def.years.length, 0);
    expect(options).toHaveLength(expected);
    expect(new Set(options.map((o) => o.label)).size).toBe(expected);
  });

  it('orders years newest first', () => {
    const years = contestYearOptions().map((o) => Number(o.year));
    expect(years).toEqual([...years].sort((a, b) => b - a));
  });
});
