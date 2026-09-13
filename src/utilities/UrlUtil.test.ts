import {
  UrlParams,
  convertRankingsStrToArray,
  encodeRankingsToURL,
  extractParams,
  orderContestantsByRankingStr,
  updateQueryParams,
  updateStates,
  urlParamHasValue,
} from './UrlUtil';
import { CountryContestant } from '../data/CountryContestant';
import { defaultYear } from '../data/Contestants';
import {
  setName,
  setYear,
  setTheme,
  setVote,
  setGlobalSearch,
  setShowComparison,
  setShowThumbnail,
  setShowPlace,
} from '../redux/rootSlice';

// mocks for dependencies
vi.mock('redux', () => ({
  Dispatch: vi.fn(),
}));

vi.mock('./ContestantRepository', () => ({
  fetchCountryContestantsByYear: vi.fn(),
}));

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
      showPlace: null,
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
      showPlace: null,
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
  setShowPlace: vi.fn(),
  setGlobalSearch: vi.fn(),
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
        comparisonMode: null,
      } as UrlParams,
      mockDispatch,
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
        comparisonMode: null,
      } as UrlParams,
      mockDispatch,
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
        comparisonMode: null,
      } as UrlParams,
      mockDispatch,
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

  it('splits a global-mode ranking into three-character uid chunks', () => {
    expect(convertRankingsStrToArray('>abcdef', true)).toEqual(['abc', 'def']);
  });

  it('treats a leading ">" as global mode even without the flag', () => {
    expect(convertRankingsStrToArray('>abcdef')).toEqual(['abc', 'def']);
  });

  it('yields nothing in global mode when the ">" marker is absent', () => {
    expect(convertRankingsStrToArray('abcdef', true)).toEqual([]);
  });
});

describe('updateStates — display toggles', () => {
  beforeEach(() => {
    mockDispatch.mockClear();
    (setGlobalSearch as any).mockClear();
    (setShowComparison as any).mockClear();
    (setShowThumbnail as any).mockClear();
    (setShowPlace as any).mockClear();
    (setYear as any).mockClear();
    (setTheme as any).mockClear();
    (setVote as any).mockClear();
  });

  const base = (overrides: Partial<UrlParams>): UrlParams =>
    ({
      rankingName: null,
      contestYear: null,
      rankings: null,
      theme: null,
      voteCode: null,
      comparisonMode: null,
      globalMode: null,
      showThumbnail: null,
      showPlace: null,
      ...overrides,
    }) as UrlParams;

  it('enables the toggles whose params are set to "t"', () => {
    updateStates(base({ globalMode: 't', comparisonMode: 't', showPlace: 't' }), mockDispatch);
    expect(setGlobalSearch).toHaveBeenCalledWith(true);
    expect(setShowComparison).toHaveBeenCalledWith(true);
    expect(setShowPlace).toHaveBeenCalledWith(true);
  });

  it('disables those toggles when the params are absent', () => {
    updateStates(base({}), mockDispatch);
    expect(setGlobalSearch).toHaveBeenCalledWith(false);
    expect(setShowComparison).toHaveBeenCalledWith(false);
    expect(setShowPlace).toHaveBeenCalledWith(false);
  });

  it('treats the thumbnail as shown unless explicitly turned off with "f"', () => {
    updateStates(base({ showThumbnail: 'f' }), mockDispatch);
    expect(setShowThumbnail).toHaveBeenCalledWith(false);

    (setShowThumbnail as any).mockClear();
    updateStates(base({ showThumbnail: null }), mockDispatch);
    expect(setShowThumbnail).toHaveBeenCalledWith(true);
  });

  it('sanitizes and dispatches a provided contest year', () => {
    updateStates(base({ contestYear: '23' }), mockDispatch);
    expect(setYear).toHaveBeenCalledWith('2023');
  });

  it('passes the theme and vote code through when present', () => {
    updateStates(base({ theme: 'ab', voteCode: 'f-tv' }), mockDispatch);
    expect(setTheme).toHaveBeenCalledWith('ab');
    expect(setVote).toHaveBeenCalledWith('f-tv');
  });
});

describe('extractParams — per-category ranking slot', () => {
  it('reads the category-specific ranking param (r{n+1})', () => {
    const params = new URLSearchParams('?r1=aaa&r2=bbb');
    expect(extractParams(params, 0).rankings).toBe('aaa');
    expect(extractParams(params, 1).rankings).toBe('bbb');
  });

  it('reads the bare "r" param when no category is active', () => {
    const params = new URLSearchParams('?r=ccc');
    expect(extractParams(params, undefined).rankings).toBe('ccc');
  });
});

describe('encodeRankingsToURL', () => {
  const item = (id?: string, uid?: string): CountryContestant =>
    ({ id, uid }) as unknown as CountryContestant;

  it('joins ids without a marker in local mode', () => {
    expect(encodeRankingsToURL([item('a'), item('b')], false)).toBe('ab');
  });

  it('prefixes a ">" and joins uids in global mode', () => {
    expect(encodeRankingsToURL([item(undefined, 'a01'), item(undefined, 'b02')], true)).toBe(
      '>a01b02',
    );
  });

  it('drops items missing the id the active mode encodes', () => {
    expect(encodeRankingsToURL([item('a'), item(undefined, 'b02')], false)).toBe('a');
  });
});

describe('urlParamHasValue / updateQueryParams', () => {
  // The coverage run uses the node environment (no jsdom), so these URL helpers,
  // which read the global window, get a minimal stub.
  const original = (globalThis as any).window;
  let pushState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    pushState = vi.fn();
    (globalThis as any).window = {
      location: { search: '', origin: 'http://x', pathname: '/' },
      history: { pushState },
    };
  });

  afterEach(() => {
    (globalThis as any).window = original;
  });

  it('matches a query param against an exact value', () => {
    (globalThis as any).window.location.search = '?g=t';
    expect(urlParamHasValue('g', 't')).toBe(true);
    expect(urlParamHasValue('g', 'f')).toBe(false);
    expect(urlParamHasValue('missing', 't')).toBe(false);
  });

  it('sets provided params and deletes ones passed as undefined', () => {
    (globalThis as any).window.location.search = '?a=1&b=2';
    updateQueryParams({ a: '9', b: undefined, c: '3' });
    expect(pushState).toHaveBeenCalledWith(null, '', '?a=9&c=3');
  });

  it('does not push a new history entry when nothing changes', () => {
    (globalThis as any).window.location.search = '?a=1';
    updateQueryParams({ a: '1' });
    expect(pushState).not.toHaveBeenCalled();
  });
});

describe('orderContestantsByRankingStr — local mode', () => {
  const cc = (id: string): CountryContestant =>
    ({ id, country: { id }, contestant: null }) as unknown as CountryContestant;

  it('resolves ranked ids against the loaded year contestants', async () => {
    const yearContestants = [cc('a'), cc('b')];
    const { rankedIds, rankedCountries } = await orderContestantsByRankingStr(
      'ba',
      yearContestants,
    );
    expect(rankedIds).toEqual(['b', 'a']);
    expect(rankedCountries.map((c) => c.id)).toEqual(['b', 'a']);
  });

  it('falls back to the country table for ids not in the loaded set', async () => {
    // 'a' is Albania and 'b' is Armenia in the country table.
    const { rankedCountries } = await orderContestantsByRankingStr('ab', []);
    expect(rankedCountries.map((c) => c.country.key).sort()).toEqual(['al', 'am']);
  });

  it('drops ids that match neither a contestant nor a known country', async () => {
    // '_z' is not a contestant id here and no country uses it.
    const { rankedCountries } = await orderContestantsByRankingStr('_z', []);
    expect(rankedCountries).toEqual([]);
  });
});
