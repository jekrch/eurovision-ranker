import { convertRankingsStrToArray, extractParams, updateStates } from "./UrlUtil";
import { setName, setYear, setTheme, setVote } from '../redux/actions';
import { defaultYear } from "../data/Contestants";


// mocks for dependencies
jest.mock('redux', () => ({
    Dispatch: jest.fn()
}));

jest.mock('./ContestantRepository', () => ({
    fetchCountryContestantsByYear: jest.fn()
}));

function mockWindowLocationSearch(search: string) {
    Object.defineProperty(window, 'location', {
        value: {
            ...window.location,
            search: search
        },
        writable: true
    });
}

// reset window.location to its original state after each test
afterEach(() => {
    jest.restoreAllMocks();
    // Reset window.location to its original state
    Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true
    });
});

const originalLocation = window.location;


describe('extractParams', () => {
    it('should extract parameters for a specific search string', () => {
        mockWindowLocationSearch('?y=2023&r=abc&t=ab&v=f-tv&n=test');

        const params = new URLSearchParams(window.location.search);
        const result = extractParams(params, undefined);

        expect(result).toEqual({
            rankingName: 'test',
            contestYear: '2023',
            rankings: 'abc',
            theme: 'ab',
            voteCode: 'f-tv'
        });
    });

    it('should extract parameters partial search string', () => {

        mockWindowLocationSearch('?y=2023&r=abc');

        const params = new URLSearchParams(window.location.search);
        const result = extractParams(params, undefined);

        expect(result).toEqual({
            rankingName: null,
            contestYear: '2023',
            rankings: 'abc',
            theme: null,
            voteCode: null,
        });
    });
});


jest.mock('../redux/actions', () => ({
    setName: jest.fn(),
    setYear: jest.fn(),
    setTheme: jest.fn(),
    setVote: jest.fn()
}));


// Create a mock dispatch function
const mockDispatch = jest.fn();

describe('updateStates', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        mockDispatch.mockClear();
        (setName as jest.Mock).mockClear();
        (setYear as jest.Mock).mockClear();
        (setTheme as jest.Mock).mockClear();
        (setVote as jest.Mock).mockClear();
    });

    it('should dispatch setName when rankingName is provided', () => {
        updateStates({ rankingName: 'Test Name', contestYear: null, theme: null, voteCode: null }, mockDispatch);
        expect(setName).toHaveBeenCalledWith('Test Name');
        expect(mockDispatch).toHaveBeenCalledWith(setName('Test Name'));
    });

    it('should dispatch setYear with defaultYear when contestYear is not provided', () => {
        updateStates({ rankingName: null, contestYear: null, theme: null, voteCode: null }, mockDispatch);
        expect(setYear).toHaveBeenCalledWith(defaultYear);
        expect(mockDispatch).toHaveBeenCalledWith(setYear(defaultYear));
    });

    it('should dispatch setTheme and setVote with empty strings when they are not provided', () => {
        updateStates({ rankingName: null, contestYear: null, theme: null, voteCode: null }, mockDispatch);
        expect(setTheme).toHaveBeenCalledWith('');
        expect(setVote).toHaveBeenCalledWith('');
        expect(mockDispatch).toHaveBeenCalledWith(setTheme(''));
        expect(mockDispatch).toHaveBeenCalledWith(setVote(''));
    });

});

describe('convertRankingsStrToArray', () => {
    it('should correctly convert a string without special characters', () => {
        expect(convertRankingsStrToArray('abc')).toEqual(['a', 'b', 'c']);
    });

    it('should correctly convert single character', () => {
        expect(convertRankingsStrToArray('a')).toEqual(['a']);
    });

    it('should correctly convert a string with periods', () => {
        expect(convertRankingsStrToArray('a.b.c')).toEqual(['a', '.b', '.c']);
    });

    it('should handle underscores followed by non-periods', () => {
        expect(convertRankingsStrToArray('a_b_c')).toEqual(['a', '_b', '_c']);
    });

    it('should handle underscores followed by periods', () => {
        expect(convertRankingsStrToArray('a_.b_.c')).toEqual(['a', '_.b', '_.c']);
    });

    it('should remove duplicates', () => {
        expect(convertRankingsStrToArray('a.a.a_b.b_.c')).toEqual(['a', '.a', '_b', '.b', '_.c']);
    });

    it('should handle empty strings', () => {
        expect(convertRankingsStrToArray('')).toEqual([]);
    });

    it('should handle strings ending with underscored codes', () => {
        expect(convertRankingsStrToArray('ab.')).toEqual(['a', 'b', '.']);
        expect(convertRankingsStrToArray('ab_c')).toEqual(['a', 'b', '_c']);
    });
});