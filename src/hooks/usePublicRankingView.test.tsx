// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';

import { usePublicRankingView } from './usePublicRankingView';
import { makeTestStore } from '../test/storeHarness';
import { ApiError } from '../utilities/api/types';

const api = vi.hoisted(() => ({
  getRanking: vi.fn(),
  getPublicRanking: vi.fn(),
}));
vi.mock('../utilities/api/rankings', () => api);

const client = vi.hoisted(() => ({
  getToken: vi.fn(() => null as string | null),
  setToken: vi.fn(),
  TOKEN_STORAGE_KEY: 'er_token',
}));
vi.mock('../utilities/api/client', () => client);

const toastError = vi.hoisted(() => vi.fn());
vi.mock('react-hot-toast', () => ({ default: { error: toastError, success: vi.fn() } }));

const urlUtil = vi.hoisted(() => ({ loadRankingsFromURL: vi.fn() }));
vi.mock('../utilities/UrlUtil', () => urlUtil);

const savedRanking = (overrides = {}) => ({
  ranking_id: 'r1',
  name: 'Sigrit picks',
  ranking: 'r=abc&v=f-t',
  year: 2023,
  author_username: 'sigrit',
  author_email: 'sigrit@example.com',
  user_id: 'u9',
  ...overrides,
});

function loader(store: ReturnType<typeof makeTestStore>) {
  const writerReadyRef = { current: false };
  const { result } = renderHook(() =>
    usePublicRankingView({
      activeCategory: undefined,
      dispatch: store.dispatch,
      writerReadyRef,
    }),
  );
  return { loadPublicRankingById: result.current.loadPublicRankingById, writerReadyRef };
}

beforeEach(() => {
  api.getRanking.mockReset().mockResolvedValue(savedRanking());
  api.getPublicRanking.mockReset().mockResolvedValue(savedRanking());
  client.getToken.mockReset().mockReturnValue(null);
  urlUtil.loadRankingsFromURL.mockReset().mockResolvedValue([]);
  toastError.mockReset();
  window.history.replaceState(null, '', '/?id=r1');
});

describe('opening a shared ranking', () => {
  it('shows it as the ranking on screen', async () => {
    const store = makeTestStore();

    await loader(store).loadPublicRankingById('r1');

    expect(store.getState().root).toMatchObject({
      name: 'Sigrit picks',
      year: '2023',
      showUnranked: false,
    });
  });

  it('credits whoever made it', async () => {
    const store = makeTestStore();

    await loader(store).loadPublicRankingById('r1');

    expect(store.getState().auth.loadedAuthor).toEqual({
      username: 'sigrit',
      email: 'sigrit@example.com',
      userId: 'u9',
    });
  });

  it('keeps the tidy share link in the address', async () => {
    const store = makeTestStore();

    await loader(store).loadPublicRankingById('r1');

    expect(store.getState().root).toMatchObject({ viewMode: 'public', publicViewId: 'r1' });
  });

  it('reads the ranking out of the saved parameters', async () => {
    const store = makeTestStore();

    await loader(store).loadPublicRankingById('r1');

    const params = new URLSearchParams(window.location.search);
    expect(params.get('r')).toBe('abc');
    expect(params.get('n')).toBe('Sigrit picks');
    expect(params.get('y')).toBe('23');
    expect(urlUtil.loadRankingsFromURL).toHaveBeenCalled();
  });

  it('understands a ranking saved in the older format', async () => {
    const store = makeTestStore();
    api.getPublicRanking.mockResolvedValue(savedRanking({ ranking: 'cy.lg.ggbno' }));

    await loader(store).loadPublicRankingById('r1');

    expect(new URLSearchParams(window.location.search).get('r')).toBe('cy.lg.ggbno');
  });

  it('treats it as unedited until the viewer changes something', async () => {
    const store = makeTestStore();

    await loader(store).loadPublicRankingById('r1');

    expect(store.getState().auth.currentRankingId).toBe('r1');
    expect(store.getState().auth.lastSavedSignature).toContain('Sigrit picks');
  });

  it('lets the address start tracking the ranking again once it is loaded', async () => {
    const store = makeTestStore();
    const { loadPublicRankingById, writerReadyRef } = loader(store);

    await loadPublicRankingById('r1');

    expect(writerReadyRef.current).toBe(true);
  });
});

describe('who the shared ranking is fetched as', () => {
  it('asks as the signed in viewer so their own and group rankings open', async () => {
    const store = makeTestStore();
    client.getToken.mockReturnValue('token');

    await loader(store).loadPublicRankingById('r1');

    expect(api.getRanking).toHaveBeenCalledWith('r1');
    expect(api.getPublicRanking).not.toHaveBeenCalled();
  });

  it('asks anonymously for a viewer who is not signed in', async () => {
    const store = makeTestStore();

    await loader(store).loadPublicRankingById('r1');

    expect(api.getPublicRanking).toHaveBeenCalledWith('r1');
    expect(api.getRanking).not.toHaveBeenCalled();
  });
});

describe('a shared ranking that will not open', () => {
  it('says so when the link points at nothing', async () => {
    const store = makeTestStore();
    api.getPublicRanking.mockRejectedValue(new ApiError('gone', 404, 'not_found'));

    await loader(store).loadPublicRankingById('r1');

    expect(toastError).toHaveBeenCalledWith('That ranking is not available.');
  });

  it('passes on what the server said about the refusal', async () => {
    const store = makeTestStore();
    api.getPublicRanking.mockRejectedValue(
      new ApiError('no', 403, 'forbidden', ' not shared with you '),
    );

    await loader(store).loadPublicRankingById('r1');

    expect(toastError).toHaveBeenCalledWith('not shared with you');
  });

  it('says something went wrong when the reason is unclear', async () => {
    const store = makeTestStore();
    api.getPublicRanking.mockRejectedValue(new Error('offline'));

    await loader(store).loadPublicRankingById('r1');

    expect(toastError).toHaveBeenCalledWith('Failed to load ranking.');
  });

  it('leaves the viewer in their own ranking rather than a half loaded one', async () => {
    const store = makeTestStore();
    api.getPublicRanking.mockRejectedValue(new ApiError('gone', 404, 'not_found'));
    const { loadPublicRankingById, writerReadyRef } = loader(store);

    await loadPublicRankingById('r1');

    expect(store.getState().root.viewMode).toBe('normal');
    expect(store.getState().auth.loadedAuthor).toBeNull();
    expect(writerReadyRef.current).toBe(true);
  });
});
