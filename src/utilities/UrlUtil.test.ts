import { UrlParams, convertRankingsStrToArray, extractParams, updateStates } from "./UrlUtil";
import { setName, setYear, setTheme, setVote, setShowComparison, setGlobalSearch, setShowThumbnail } from '../redux/rootSlice';
import { defaultYear } from "../data/Contestants";
import { JSDOM } from 'jsdom';


// mocks for dependencies
vi.mock('redux', () => ({
    Dispatch: vi.fn()
}));

vi.mock('./ContestantRepository', () => ({
    fetchCountryContestantsByYear: vi.fn()
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

    // const dom = new JSDOM();
    // global.navigator = dom.window.navigator;

    vi.restoreAllMocks();
});

describe('extractParams', () => {
    let mockWindow: Window;

    beforeEach(() => {
        mockWindow = {
            location: {
                search: '',
                href: 'http://localhost',
            },
        } as unknown as Window;
    });

    it('should extract parameters for a specific search string', () => {
        const searchString = '?y=2023&r=abc&t=ab&v=f-tv&n=test';
        mockWindow.location.search = searchString;
        mockWindow.location.href = 'http://localhost' + searchString;

        const params = new URLSearchParams(mockWindow.location.search);
        const result = extractParams(params, undefined);

        expect(result).toEqual({
            rankingName: 'test',
            contestYear: '2023',
            rankings: 'abc',
            theme: 'ab',
            voteCode: 'f-tv',
            comparisonMode: null,
            globalMode: null,
            showThumbnail: null,
        });
    });

    it('should extract parameters partial search string', () => {
        const searchString = '?y=2023&r=abc';
        mockWindow.location.search = searchString;
        mockWindow.location.href = 'http://localhost' + searchString;

        const params = new URLSearchParams(mockWindow.location.search);
        const result = extractParams(params, undefined);

        expect(result).toEqual({
            rankingName: null,
            contestYear: '2023',
            rankings: 'abc',
            theme: null,
            globalMode: null,
            voteCode: null,
            comparisonMode: null,
            showThumbnail: null,
        });
    });
});

vi.mock('../redux/rootSlice', () => ({
    setName: vi.fn(),
    setYear: vi.fn(),
    setTheme: vi.fn(),
    setVote: vi.fn(),
    setShowComparison: vi.fn(),
    setShowThumbnail: vi.fn(),
    setGlobalSearch: vi.fn()
}));


// Create a mock dispatch function
const mockDispatch = vi.fn();

describe('updateStates', () => {
    beforeEach(() => {
        // Clear all mocks before each test
        mockDispatch.mockClear();
        (setName as any).mockClear();
        (setYear as any).mockClear();
        (setTheme as any).mockClear();
        (setVote as any).mockClear();
        (setGlobalSearch as any).mockClear();
    });

    it('should dispatch setName when rankingName is provided', () => {
        updateStates(
            { 
                rankingName: 'Test Name', 
                contestYear: null, 
                theme: null, 
                globalMode: null,
                voteCode: null, 
                comparisonMode: null 
            } as UrlParams, mockDispatch
        );
        expect(setName).toHaveBeenCalledWith('Test Name');
        expect(mockDispatch).toHaveBeenCalledWith(setName('Test Name'));
    });

    it('should dispatch setYear with defaultYear when contestYear is not provided', () => {
        updateStates(
            { 
                rankingName: null, 
                contestYear: null,
                 theme: null, 
                 globalMode: null,
                 voteCode: null, 
                 comparisonMode: null 
            } as UrlParams, 
            mockDispatch
        );
        expect(setYear).toHaveBeenCalledWith(defaultYear);
        expect(mockDispatch).toHaveBeenCalledWith(setYear(defaultYear));
    });

    it('should dispatch setTheme and setVote with empty strings when they are not provided', () => {
        updateStates(
            { 
                rankingName: null, 
                contestYear: null,
                 theme: null, 
                 voteCode: null, 
                 comparisonMode: null 
            } as UrlParams, 
            mockDispatch
        );
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