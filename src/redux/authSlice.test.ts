const client = vi.hoisted(() => ({
  getToken: vi.fn(() => null as string | null),
  setToken: vi.fn(),
  TOKEN_STORAGE_KEY: 'er_token',
}));

vi.mock('../utilities/api/client', () => client);

import authReducer, {
  clearCurrentRanking,
  isTokenExpired,
  loadInitialAuth,
  loginSuccess,
  logout,
  patchUser,
  removeSavedRanking,
  setAuthError,
  setAuthStatus,
  setCurrentRankingId,
  setLastSavedSignature,
  setLoadedAuthor,
  setSavedRankings,
  upsertSavedRanking,
  userFromToken,
} from './authSlice';
import { AuthUser, UserRanking } from '../utilities/api/types';

function token(payload: Record<string, unknown>): string {
  const body = btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_');
  return `header.${body}.signature`;
}

const user: AuthUser = { id: 'u1', email: 'someone@example.com' };

const ranking = (overrides: Partial<UserRanking> = {}): UserRanking => ({
  ranking_id: 'r1',
  name: 'My Ranking',
  ranking: 'abc',
  ...overrides,
});

const state = (actions: { type: string }[] = []) =>
  actions.reduce((acc, action) => authReducer(acc, action), authReducer(undefined, { type: '@@' }));

beforeEach(() => {
  client.getToken.mockReset().mockReturnValue(null);
  client.setToken.mockReset();
});

describe('isTokenExpired', () => {
  it('reports an expired token', () => {
    expect(isTokenExpired(token({ exp: Math.floor(Date.now() / 1000) - 60 }))).toBe(true);
  });

  it('accepts a token that is still valid', () => {
    expect(isTokenExpired(token({ exp: Math.floor(Date.now() / 1000) + 600 }))).toBe(false);
  });

  it('accepts a token that never expires', () => {
    expect(isTokenExpired(token({ sub: 'u1' }))).toBe(false);
  });

  it('accepts a token it cannot read rather than locking the user out', () => {
    expect(isTokenExpired('not-a-token')).toBe(false);
    expect(isTokenExpired('a.b.c')).toBe(false);
  });
});

describe('userFromToken', () => {
  it('identifies the user from the subject claim', () => {
    expect(userFromToken(token({ sub: 'u1', email: 'someone@example.com' }))).toEqual(user);
  });

  it('identifies the user from the user id claim', () => {
    expect(userFromToken(token({ user_id: 'u1', email: 'someone@example.com' }))).toEqual(user);
  });

  it('identifies nobody when the token names no user', () => {
    expect(userFromToken(token({ email: 'someone@example.com' }))).toBeNull();
  });

  it('identifies nobody when the token carries no email', () => {
    expect(userFromToken(token({ sub: 'u1' }))).toBeNull();
  });

  it('identifies nobody from an unreadable token', () => {
    expect(userFromToken('not-a-token')).toBeNull();
  });
});

describe('loadInitialAuth', () => {
  it('starts signed out when nothing is stored', () => {
    expect(loadInitialAuth()).toEqual({ token: null, user: null });
  });

  it('restores the signed in user from a valid stored token', () => {
    const stored = token({ sub: 'u1', email: 'someone@example.com', exp: 9999999999 });
    client.getToken.mockReturnValue(stored);

    expect(loadInitialAuth()).toEqual({ token: stored, user });
  });

  it('discards a stored token that has expired', () => {
    client.getToken.mockReturnValue(token({ sub: 'u1', exp: 1 }));

    expect(loadInitialAuth()).toEqual({ token: null, user: null });
    expect(client.setToken).toHaveBeenCalledWith(null);
  });
});

describe('sign in and out', () => {
  it('records the signed in user and persists their token', () => {
    const result = state([setAuthError('bad password'), loginSuccess({ token: 't1', user })]);

    expect(result).toMatchObject({
      token: 't1',
      user,
      authStatus: 'idle',
      authError: null,
    });
    expect(client.setToken).toHaveBeenCalledWith('t1');
  });

  it('forgets the session and everything loaded with it on sign out', () => {
    const result = state([
      loginSuccess({ token: 't1', user }),
      setCurrentRankingId('r1'),
      setLastSavedSignature('sig'),
      setLoadedAuthor({ username: 'someone' }),
      setSavedRankings([ranking()]),
      logout(),
    ]);

    expect(result).toMatchObject({
      token: null,
      user: null,
      currentRankingId: null,
      lastSavedSignature: null,
      loadedAuthor: null,
      savedRankings: null,
    });
    expect(client.setToken).toHaveBeenLastCalledWith(null);
  });
});

describe('sign in progress', () => {
  it('clears a previous failure once a new attempt starts', () => {
    const result = state([setAuthError('bad password'), setAuthStatus('loading')]);

    expect(result).toMatchObject({ authStatus: 'loading', authError: null });
  });

  it('keeps the message describing a failed attempt', () => {
    const result = state([setAuthStatus('loading'), setAuthError('bad password')]);

    expect(result).toMatchObject({ authStatus: 'error', authError: 'bad password' });
  });

  it('returns to rest when a failure is dismissed', () => {
    const result = state([setAuthError('bad password'), setAuthError(null)]);

    expect(result).toMatchObject({ authStatus: 'idle', authError: null });
  });

  it('keeps the failure message while the status stays on error', () => {
    const result = state([setAuthError('bad password'), setAuthStatus('error')]);

    expect(result.authError).toBe('bad password');
  });
});

describe('the ranking being edited', () => {
  it('forgets which saved ranking is open when the ranking is reset', () => {
    const result = state([
      setCurrentRankingId('r1'),
      setLastSavedSignature('sig'),
      setLoadedAuthor({ username: 'someone' }),
      clearCurrentRanking(),
    ]);

    expect(result).toMatchObject({
      currentRankingId: null,
      lastSavedSignature: null,
      loadedAuthor: null,
    });
  });

  it('remembers who authored a ranking opened from a link', () => {
    const result = state([setLoadedAuthor({ username: 'someone', userId: 'u9' })]);

    expect(result.loadedAuthor).toEqual({ username: 'someone', userId: 'u9' });
  });
});

describe('the signed in profile', () => {
  it('applies a profile change without dropping the rest of the account', () => {
    const result = state([loginSuccess({ token: 't1', user }), patchUser({ username: 'someone' })]);

    expect(result.user).toEqual({ ...user, username: 'someone' });
  });

  it('has no profile to change while signed out', () => {
    const result = state([patchUser({ username: 'someone' })]);

    expect(result.user).toBeNull();
  });
});

describe('saved rankings', () => {
  it('starts the collection with the first ranking saved', () => {
    const result = state([upsertSavedRanking(ranking())]);

    expect(result.savedRankings).toEqual([ranking()]);
  });

  it('puts a newly saved ranking at the top of the collection', () => {
    const result = state([
      setSavedRankings([ranking({ ranking_id: 'r1' })]),
      upsertSavedRanking(ranking({ ranking_id: 'r2' })),
    ]);

    expect(result.savedRankings!.map((r) => r.ranking_id)).toEqual(['r2', 'r1']);
  });

  it('updates a ranking in place when it is saved again', () => {
    const result = state([
      setSavedRankings([ranking({ ranking_id: 'r1' }), ranking({ ranking_id: 'r2' })]),
      upsertSavedRanking(ranking({ ranking_id: 'r1', name: 'Renamed' })),
    ]);

    expect(result.savedRankings!.map((r) => r.name)).toEqual(['Renamed', 'My Ranking']);
  });

  it('drops a deleted ranking from the collection', () => {
    const result = state([
      setSavedRankings([ranking({ ranking_id: 'r1' }), ranking({ ranking_id: 'r2' })]),
      removeSavedRanking('r1'),
    ]);

    expect(result.savedRankings!.map((r) => r.ranking_id)).toEqual(['r2']);
  });

  it('has nothing to delete before the collection is loaded', () => {
    const result = state([removeSavedRanking('r1')]);

    expect(result.savedRankings).toBeNull();
  });
});
