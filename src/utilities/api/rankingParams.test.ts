import {
  buildRankingParamsFromUrl,
  normalizeStoredRanking,
  parseStoredRanking,
} from './rankingParams';

describe('buildRankingParamsFromUrl', () => {
  it('keeps the params that describe a ranking', () => {
    const result = buildRankingParamsFromUrl('?r=abc&v=f-t&t=c');

    expect(new URLSearchParams(result).get('r')).toBe('abc');
    expect(new URLSearchParams(result).get('v')).toBe('f-t');
    expect(new URLSearchParams(result).get('t')).toBe('c');
  });

  it('leaves out the name and year kept alongside the ranking', () => {
    const result = buildRankingParamsFromUrl('?r=abc&n=My+list&y=23');

    expect(result).toBe('r=abc');
  });

  it('leaves out params that only route the app', () => {
    const result = buildRankingParamsFromUrl('?r=abc&id=42&signup=1');

    expect(result).toBe('r=abc');
  });

  it('builds an empty value from a url with no params', () => {
    expect(buildRankingParamsFromUrl('')).toBe('');
  });
});

describe('parseStoredRanking', () => {
  it('reads back a stored query string', () => {
    const params = parseStoredRanking('r=abc&v=f-t');

    expect(params.get('r')).toBe('abc');
    expect(params.get('v')).toBe('f-t');
  });

  it('treats a bare stored value as the ranking itself', () => {
    const params = parseStoredRanking('cy.lg.ggbno');

    expect(params.get('r')).toBe('cy.lg.ggbno');
  });

  it('reads nothing from an empty stored value', () => {
    expect([...parseStoredRanking('')]).toEqual([]);
  });
});

describe('normalizeStoredRanking', () => {
  it('leaves a stored query string as it is', () => {
    expect(normalizeStoredRanking('r=abc&v=f-t')).toBe('r=abc&v=f-t');
  });

  it('rewrites a bare stored ranking into the same shape the url uses', () => {
    expect(normalizeStoredRanking('cy.lg.ggbno')).toBe('r=cy.lg.ggbno');
  });

  it('normalizes an empty stored value to nothing', () => {
    expect(normalizeStoredRanking('')).toBe('');
  });

  it('lines a bare stored ranking up with the same ranking read from the url', () => {
    expect(normalizeStoredRanking('cy.lg')).toBe(buildRankingParamsFromUrl('?r=cy.lg'));
  });
});
