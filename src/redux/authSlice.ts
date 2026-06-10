import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { getToken, setToken, TOKEN_STORAGE_KEY } from '../utilities/api/client';
import { AuthUser, UserRanking } from '../utilities/api/types';

export type AuthStatus = 'idle' | 'loading' | 'error';

export interface LoadedAuthor {
  username?: string;
  email?: string;
  userId?: string;
}

export interface AuthState {
  user: AuthUser | null;
  token: string | null;
  authStatus: AuthStatus;
  authError: string | null;
  currentRankingId: string | null;
  lastSavedSignature: string | null;
  savedRankings: UserRanking[] | null;
  // Author of a ranking loaded by id (share/public link). Set when a ranking
  // is loaded, cleared when the current ranking is reset. Drives the subtle
  // "loaded ranking by <author>" attribution in the header.
  loadedAuthor: LoadedAuthor | null;
}

interface JwtPayload {
  exp?: number;
  sub?: string;
  user_id?: string;
  email?: string;
  [key: string]: unknown;
}

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function isTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload || typeof payload.exp !== 'number') return false;
  return payload.exp * 1000 <= Date.now();
}

export function userFromToken(token: string): AuthUser | null {
  const payload = decodeJwtPayload(token);
  if (!payload) return null;
  const id = payload.sub ?? payload.user_id;
  const email = payload.email;
  if (!id || !email) return null;
  return { id: String(id), email: String(email) };
}

export function loadInitialAuth(): { token: string | null; user: AuthUser | null } {
  const stored = getToken();
  if (!stored) return { token: null, user: null };
  if (isTokenExpired(stored)) {
    setToken(null);
    return { token: null, user: null };
  }
  return { token: stored, user: userFromToken(stored) };
}

const initialAuth = loadInitialAuth();

const initialState: AuthState = {
  user: initialAuth.user,
  token: initialAuth.token,
  authStatus: 'idle',
  authError: null,
  currentRankingId: null,
  lastSavedSignature: null,
  savedRankings: null,
  loadedAuthor: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuthStatus: (state, action: PayloadAction<AuthStatus>) => {
      state.authStatus = action.payload;
      if (action.payload !== 'error') state.authError = null;
    },
    setAuthError: (state, action: PayloadAction<string | null>) => {
      state.authError = action.payload;
      state.authStatus = action.payload ? 'error' : 'idle';
    },
    loginSuccess: (state, action: PayloadAction<{ token: string; user: AuthUser }>) => {
      state.token = action.payload.token;
      state.user = action.payload.user;
      state.authStatus = 'idle';
      state.authError = null;
      setToken(action.payload.token);
    },
    logout: (state) => {
      state.token = null;
      state.user = null;
      state.authStatus = 'idle';
      state.authError = null;
      state.currentRankingId = null;
      state.lastSavedSignature = null;
      state.loadedAuthor = null;
      state.savedRankings = null;
      // Group state is cleared by groupsSlice listening to this action.
      setToken(null);
    },
    setCurrentRankingId: (state, action: PayloadAction<string | null>) => {
      state.currentRankingId = action.payload;
    },
    setLastSavedSignature: (state, action: PayloadAction<string | null>) => {
      state.lastSavedSignature = action.payload;
    },
    clearCurrentRanking: (state) => {
      state.currentRankingId = null;
      state.lastSavedSignature = null;
      state.loadedAuthor = null;
    },
    setLoadedAuthor: (state, action: PayloadAction<LoadedAuthor | null>) => {
      state.loadedAuthor = action.payload;
    },
    patchUser: (state, action: PayloadAction<Partial<AuthUser>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setSavedRankings: (state, action: PayloadAction<UserRanking[] | null>) => {
      state.savedRankings = action.payload;
    },
    upsertSavedRanking: (state, action: PayloadAction<UserRanking>) => {
      const r = action.payload;
      if (!state.savedRankings) {
        state.savedRankings = [r];
        return;
      }
      const idx = state.savedRankings.findIndex((x) => x.ranking_id === r.ranking_id);
      if (idx >= 0) state.savedRankings[idx] = r;
      else state.savedRankings.unshift(r);
    },
    removeSavedRanking: (state, action: PayloadAction<string>) => {
      if (!state.savedRankings) return;
      state.savedRankings = state.savedRankings.filter((x) => x.ranking_id !== action.payload);
    },
    // Ranking↔group link reducers. They live here because they mutate the
    // savedRankings collection (owned by this slice), even though they are
    // dispatched from group flows.
    addGroupIdToRanking: (state, action: PayloadAction<{ rankingId: string; groupId: string }>) => {
      if (!state.savedRankings) return;
      const r = state.savedRankings.find((x) => x.ranking_id === action.payload.rankingId);
      if (!r) return;
      const next = new Set(r.group_ids ?? []);
      next.add(action.payload.groupId);
      r.group_ids = Array.from(next);
    },
    removeGroupIdFromRanking: (
      state,
      action: PayloadAction<{ rankingId: string; groupId: string }>,
    ) => {
      if (!state.savedRankings) return;
      const r = state.savedRankings.find((x) => x.ranking_id === action.payload.rankingId);
      if (!r || !r.group_ids) return;
      r.group_ids = r.group_ids.filter((id) => id !== action.payload.groupId);
    },
  },
});

export const {
  setAuthStatus,
  setAuthError,
  loginSuccess,
  logout,
  setCurrentRankingId,
  setLastSavedSignature,
  clearCurrentRanking,
  setLoadedAuthor,
  patchUser,
  setSavedRankings,
  upsertSavedRanking,
  removeSavedRanking,
  addGroupIdToRanking,
  removeGroupIdFromRanking,
} = authSlice.actions;

export { TOKEN_STORAGE_KEY };

export default authSlice.reducer;
