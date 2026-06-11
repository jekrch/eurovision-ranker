// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

// The hook delegates the actual URL writing to ContestantUtil; stub it so we
// can assert on the mode/args it forwards without touching window.location.
vi.mock('../utilities/ContestantUtil', () => ({
  convertRankingUrlParamsByMode: vi.fn(),
}));

import { useConvertRankParams } from './useConvertRankParams';
import { CountryContestant } from '../data/CountryContestant';
import { convertRankingUrlParamsByMode } from '../utilities/ContestantUtil';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

const cc = (id: string): CountryContestant =>
  ({ id, uid: id, country: { id, key: id, name: id }, contestant: null }) as CountryContestant;

const mocked = vi.mocked(convertRankingUrlParamsByMode);

describe('useConvertRankParams', () => {
  beforeEach(() => mocked.mockClear());

  it('forwards the current categories, globalSearch flag, and rankedItems', () => {
    const rankedItems = [cc('a'), cc('b')];
    const store = makeTestStore({ root: { rankedItems, globalSearch: true } });

    const { result } = renderHook(() => useConvertRankParams(), { wrapper: storeWrapper(store) });
    result.current();

    expect(mocked).toHaveBeenCalledTimes(1);
    expect(mocked).toHaveBeenCalledWith([], true, rankedItems);
  });

  it('lets an explicit flag override the store globalSearch value', () => {
    const store = makeTestStore({ root: { globalSearch: true } });

    const { result } = renderHook(() => useConvertRankParams(), { wrapper: storeWrapper(store) });
    result.current(false);

    expect(mocked).toHaveBeenCalledWith([], false, []);
  });

  it('uses the store globalSearch value when the flag is undefined', () => {
    const store = makeTestStore({ root: { globalSearch: false } });

    const { result } = renderHook(() => useConvertRankParams(), { wrapper: storeWrapper(store) });
    result.current(undefined);

    expect(mocked).toHaveBeenCalledWith([], false, []);
  });
});
