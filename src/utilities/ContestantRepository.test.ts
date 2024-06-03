import { cachedYear, initialCountryContestantCache } from "../data/InitialContestants";
import { fetchAndProcessCountryContestants } from "./ContestantRepository";
import fs from 'fs';
import path from 'path';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

beforeEach(() => {
    fetchMock.resetMocks();
});

describe.skip('contestantCache validation', () => {
    it('the cached contestant data should be identical to the data we would fetch otherwise', async () => {

        mockFetchFromPath('contestants.csv', '../.././public/contestants.csv');
        mockFetchFromPath('votes.csv', '../.././public/votes.csv');

        const result = await fetchAndProcessCountryContestants(cachedYear, '', undefined);
        
        initialCountryContestantCache.forEach(c => {
            c.contestant!.finalsRank = c.contestant?.finalsRank?.toString()?.replace('.0', '') as number | undefined;
            c.contestant!.semiFinalsRank = c.contestant?.semiFinalsRank?.toString()?.replace('.0', '') as number | undefined;
            return c;
        })
        
        expect(result).toEqual(initialCountryContestantCache);
    });
});

async function mockFetchFromPath(endpoint: string, filePath: string) {

    const csvFilePath = path.join(__dirname, filePath);
    const csvData = fs.readFileSync(csvFilePath, 'utf-8');

    fetchMock.mockResponseOnce(csvData);
}
