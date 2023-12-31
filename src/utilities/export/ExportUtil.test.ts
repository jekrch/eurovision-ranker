import { CountryContestant } from "../../data/CountryContestant";
import { convertToCSV, convertToJSON, copyDataToClipboard } from './ExportUtil';
import { Contestant } from '../../data/Contestant';
import { Country } from '../../data/Country';

const mockCountryContestants = [
    {
        id: "test1",
        country: {
            name: 'country1',
            key: 'ab'
        } as Country,
        contestant:
            {
                countryKey: 'country1',
                artist: 'artist1',
                song: 'song1',
                finalsRank: 3,
                semiFinalsRank: 4,
                youtube: 'https://www.youtube.com/watch?v=video1' // has youtube link
            } as Contestant
    },
    {
        id: "test1",
        country: {
            name: 'country2',
            key: 'cd'
        } as Country,
        contestant:
            {
                countryKey: 'country1',
                artist: 'artist1',
                song: 'song1',
                finalsRank: 3,
                semiFinalsRank: 4,
                youtube: undefined // no youtube
            } as Contestant
    },
] as CountryContestant[];

describe('convertToCSV', () => {
    it('converts country contestants to CSV format', () => {
        const csvString = convertToCSV(mockCountryContestants);
        const normalizedCsvString = csvString.replace(/\r\n/g, '\n').trim();

        const expectedCsvString = "rank,countryName,countryKey,artist,song,youtube,totalVotes\n1,country1,ab,artist1,song1,https://www.youtube.com/watch?v=video1,0\n2,country2,cd,artist1,song1,,0";

        expect(typeof normalizedCsvString).toBe('string');
        expect(normalizedCsvString).toBe(expectedCsvString);
    });
});


describe('convertToJSON', () => {
    it('converts country contestants to JSON format', async () => {

        const jsonString = await convertToJSON(mockCountryContestants);

        expect(typeof jsonString).toBe('string');
        expect(jsonString).toBe('[{"rank":"1","countryName":"country1","countryKey":"ab","artist":"artist1","song":"song1","youtube":"https://www.youtube.com/watch?v=video1","totalVotes":"0"},{"rank":"2","countryName":"country2","countryKey":"cd","artist":"artist1","song":"song1","youtube":"","totalVotes":"0"}]')
    });
});


describe('copyDataToClipboard', () => {
    it('copies text to clipboard', async () => {
        const text = 'Sample text';
        Object.assign(navigator, {
            clipboard: {
                writeText: jest.fn().mockResolvedValue(undefined)
            }
        });

        await copyDataToClipboard(text);

        expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
    });
});
