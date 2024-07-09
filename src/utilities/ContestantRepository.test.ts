import { cachedYear, initialCountryContestantCache } from "../data/InitialContestants";
import { fetchAndProcessCountryContestants, fetchCountryContestantsByYear } from "./ContestantRepository";
import { describe, it, expect, beforeEach } from 'vitest';
import { vi } from 'vitest';

beforeEach(() => {
    vi.resetAllMocks();
});

describe('contestantCache validation', () => {
    it('the cached contestant data should be returned', async () => {
        const mockFetch = vi.fn();
        mockFetch.mockResolvedValueOnce({ text: () => Promise.resolve('mocked vote csv data') });
        mockFetch.mockResolvedValueOnce({ text: () => Promise.resolve('mocked contestant csv data') });
        vi.stubGlobal('fetch', mockFetch);

        const result = await fetchCountryContestantsByYear(cachedYear, '', dispatch);
        
        initialCountryContestantCache.forEach(c => {
            c.contestant!.finalsRank = c.contestant?.finalsRank?.toString()?.replace('.0', '') as number | undefined;
            c.contestant!.semiFinalsRank = c.contestant?.semiFinalsRank?.toString()?.replace('.0', '') as number | undefined;
            return c;
        });
        
        expect(result).toEqual(initialCountryContestantCache);
        expect(mockFetch).toHaveBeenCalledTimes(0);
    });
});