import { describe, it, expect, vi, beforeEach } from 'vitest';

import { Country } from '../data/Country';
import { CountryContestant } from '../data/CountryContestant';

// getRankingComparison loads contestant data for the year to attach
// CountryContestant objects to the diff rows; mock it so the comparison math
// runs on a fixed roster. The similarity percentage itself derives purely from
// the ranking codes, independent of this data.
const fetchCountryContestantsByYear = vi.fn();
vi.mock('./ContestantRepository', () => ({
  fetchCountryContestantsByYear: (year: string) => fetchCountryContestantsByYear(year),
}));

import {
  getRankingComparison,
  findMostSimilarLists,
  findMostDissimilarLists,
  isArrayEqual,
} from './RankAnalyzer';

// Ranking codes are single-character ids here, so 'abcde' → ['a','b','c','d','e'].
const roster = (ids: string[]): CountryContestant[] =>
  ids.map((id) => ({
    id,
    country: { key: id, name: id.toUpperCase(), id } as Country,
    contestant: null,
  }));

beforeEach(() => {
  fetchCountryContestantsByYear.mockReset();
  fetchCountryContestantsByYear.mockResolvedValue(roster(['a', 'b', 'c', 'd', 'e']));
});

describe('isArrayEqual', () => {
  it('is true for element-wise equal arrays', () => {
    expect(isArrayEqual(['a', 'b'], ['a', 'b'])).toBe(true);
    expect(isArrayEqual([], [])).toBe(true);
  });

  it('is false for different lengths or contents', () => {
    expect(isArrayEqual(['a'], ['a', 'b'])).toBe(false);
    expect(isArrayEqual(['a', 'b'], ['b', 'a'])).toBe(false);
  });
});

describe('getRankingComparison', () => {
  it('scores two identical rankings as 100% similar', async () => {
    const result = await getRankingComparison('2023', 'abcde', 'abcde');
    expect(result.percentSimilarity).toBeCloseTo(100);
  });

  it('scores a reversed ranking below an identical one', async () => {
    const same = await getRankingComparison('2023', 'abcde', 'abcde');
    const reversed = await getRankingComparison('2023', 'abcde', 'edcba');
    expect(reversed.percentSimilarity).toBeLessThan(same.percentSimilarity);
  });

  it('ranks a near-identical list above a more shuffled one', async () => {
    // one adjacent swap vs. a full reversal
    const oneSwap = await getRankingComparison('2023', 'abcde', 'bacde');
    const reversed = await getRankingComparison('2023', 'abcde', 'edcba');
    expect(oneSwap.percentSimilarity).toBeGreaterThan(reversed.percentSimilarity);
  });

  it('truncates the longer list so both are aligned to the shorter size', async () => {
    // list2 has only 3 entries; comparison is over the top 3 of list1
    const result = await getRankingComparison('2023', 'abcde', 'abc');
    expect(result.filteredList1).toHaveLength(3);
    expect(result.filteredList1.map((c) => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('attaches the source-list contestants and diff rows', async () => {
    const result = await getRankingComparison('2023', 'abcde', 'edcba');
    expect(result.year).toBe('2023');
    expect(result.list1Code).toBe('abcde');
    expect(result.list2Code).toBe('edcba');
    expect(result.filteredList1.map((c) => c.id)).toEqual(['a', 'b', 'c', 'd', 'e']);
    // up to two biggest/smallest difference rows are surfaced
    expect(result.mostDifferentRankings.length).toBeGreaterThan(0);
    expect(result.mostSimilarRankings.length).toBeGreaterThan(0);
    for (const row of result.mostDifferentRankings) {
      expect(row.list1Rank).toBeGreaterThan(0);
      expect(row.list2Rank).toBeGreaterThan(0);
    }
  });
});

describe('findMostSimilarLists / findMostDissimilarLists', () => {
  it('finds the candidate most similar to the reference', async () => {
    const matches = await findMostSimilarLists('2023', 'abcde', [
      'abcde', // identical → most similar
      'edcba', // reversed
    ]);
    expect(matches).toHaveLength(1);
    expect(matches[0].list2Code).toBe('abcde');
    expect(matches[0].percentSimilarity).toBeCloseTo(100);
  });

  it('returns all ties for the top similarity', async () => {
    const matches = await findMostSimilarLists('2023', 'abcde', ['abcde', 'abcde']);
    expect(matches).toHaveLength(2);
  });

  it('finds the candidate least similar to the reference', async () => {
    const matches = await findMostDissimilarLists('2023', 'abcde', ['abcde', 'edcba']);
    expect(matches).toHaveLength(1);
    expect(matches[0].list2Code).toBe('edcba');
  });
});
