import { combineReducers, configureStore } from '@reduxjs/toolkit';
import React from 'react';
import { Provider } from 'react-redux';

import authReducer from '../redux/authSlice';
import groupsReducer from '../redux/groupsSlice';
import rootReducer from '../redux/rootSlice';
import tableReducer from '../redux/tableSlice';

/**
 * Builds a real store wired with the same four domain slices as production
 * (`store.ts`), so hooks/components under test exercise the genuine reducers
 * and selector shape rather than a hand-rolled mock. `preloadedState` is a
 * deep-partial: only the keys you set are overridden; the rest fall back to
 * each slice's `initialState`.
 */
const rootReducerCombined = combineReducers({
  root: rootReducer,
  auth: authReducer,
  table: tableReducer,
  groups: groupsReducer,
});

export type TestState = ReturnType<typeof rootReducerCombined>;

type DeepPartial<T> = { [K in keyof T]?: DeepPartial<T[K]> };

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

// Redux replaces (does not merge) preloaded slice state, so a partial like
// `{ table: { tableState: { entries } } }` would wipe the other tableState
// fields. Deep-merge the partial onto each slice's real initialState instead.
function deepMerge<T>(base: T, override: unknown): T {
  if (!isPlainObject(base) || !isPlainObject(override)) return (override ?? base) as T;
  const out: Record<string, unknown> = { ...base };
  for (const [key, value] of Object.entries(override)) {
    out[key] = deepMerge((base as Record<string, unknown>)[key], value);
  }
  return out as T;
}

export function makeTestStore(preloadedState?: DeepPartial<TestState>) {
  const defaults = rootReducerCombined(undefined, { type: '@@INIT/test' });
  return configureStore({
    reducer: rootReducerCombined,
    preloadedState: deepMerge(defaults, preloadedState),
  });
}

export type TestStore = ReturnType<typeof makeTestStore>;

/** A `<Provider>` wrapper for `renderHook`/`render` bound to the given store. */
export function storeWrapper(store: TestStore) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}
