// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useUrlWriter } from './useUrlWriter';
import { CountryContestant } from '../data/CountryContestant';
import { setName, setYear, setGlobalSearch } from '../redux/rootSlice';
import { makeTestStore, TestStore, storeWrapper } from '../test/storeHarness';
import { Category } from '../utilities/CategoryUtil';

const cc = (id: string): CountryContestant =>
  ({ id, uid: id, country: { id, key: id, name: id }, contestant: null }) as CountryContestant;
const cat = (name: string) => ({ name, weight: 5 }) as Category;

/**
 * The single store -> URL writer projects the store's canonical params onto the
 * URL. It is the only thing that writes those params, and it leaves params the
 * store does not own (share-id, deep-link tokens) untouched. It does nothing
 * until armed (boot hydration complete) and while a `?id=` public view is shown.
 */

const ref = (value: boolean): React.MutableRefObject<boolean> => ({ current: value });

const setUrl = (search: string) => window.history.replaceState(null, '', search);
const search = () => new URLSearchParams(window.location.search);

function mountWriter(
  store: TestStore,
  opts: { ready?: boolean; publicView?: boolean } = {},
) {
  const readyRef = ref(opts.ready ?? true);
  const publicViewActiveRef = ref(opts.publicView ?? false);
  return renderHook(() => useUrlWriter({ readyRef, publicViewActiveRef }), {
    wrapper: storeWrapper(store),
  });
}

describe('store -> URL writer', () => {
  beforeEach(() => setUrl('/'));

  it('projects the store name, year, and global-search params onto the URL', () => {
    const store = makeTestStore({
      root: { name: 'Bob', year: '2023', globalSearch: true },
    });

    mountWriter(store);

    expect(search().get('n')).toBe('Bob');
    expect(search().get('y')).toBe('23');
    expect(search().get('g')).toBe('t');
  });

  it('leaves params it does not own untouched', () => {
    setUrl('/?id=xyz');
    const store = makeTestStore({ root: { name: 'Bob' } });

    mountWriter(store);

    expect(search().get('id')).toBe('xyz');
    expect(search().get('n')).toBe('Bob');
  });

  it('writes the updated value when a managed param changes in the store', () => {
    const store = makeTestStore({ root: { name: 'Bob' } });
    mountWriter(store);
    expect(search().get('n')).toBe('Bob');

    act(() => {
      store.dispatch(setName('Alice'));
    });

    expect(search().get('n')).toBe('Alice');
  });

  it('drops a managed param when its store value clears', () => {
    setUrl('/?g=t');
    const store = makeTestStore({ root: { globalSearch: true } });
    mountWriter(store);

    act(() => {
      store.dispatch(setGlobalSearch(false));
    });

    expect(search().has('g')).toBe(false);
  });

  it('stays idle until armed, so a half-hydrated store cannot clobber the URL', () => {
    setUrl('/?y=23&r=ab');
    const store = makeTestStore(); // empty store, as during boot
    mountWriter(store, { ready: false });

    act(() => {
      store.dispatch(setYear('2023'));
    });

    // The share link is preserved untouched while the writer is unarmed.
    expect(search().get('r')).toBe('ab');
    expect(search().has('n')).toBe(false);
  });

  it('stays idle while a public-view share URL is shown', () => {
    setUrl('/?id=xyz');
    const store = makeTestStore({ root: { name: 'Bob', year: '2023' } });

    mountWriter(store, { publicView: true });

    expect(window.location.search).toBe('?id=xyz');
  });

  it('projects the single ranking as `r` when no categories are defined', () => {
    const store = makeTestStore({
      root: { categoryRankings: [[cc('a'), cc('b')]], categories: [] },
    });

    mountWriter(store);

    expect(search().get('r')).toBe('ab');
    expect(search().has('r1')).toBe(false);
  });

  it('projects each category order as its own `rN` param', () => {
    const store = makeTestStore({
      root: {
        categoryRankings: [
          [cc('a'), cc('b')],
          [cc('b'), cc('a')],
        ],
        categories: [cat('c1'), cat('c2')],
      },
    });

    mountWriter(store);

    expect(search().get('r1')).toBe('ab');
    expect(search().get('r2')).toBe('ba');
    // the category-less `r` is not projected once categories exist
    expect(search().has('r')).toBe(false);
  });

  it('drops ranking params that the store no longer projects', () => {
    // URL carries a stale third category ranking; the store has only two.
    setUrl('/?r1=ab&r2=ba&r3=ab');
    const store = makeTestStore({
      root: {
        categoryRankings: [
          [cc('a'), cc('b')],
          [cc('b'), cc('a')],
        ],
        categories: [cat('c1'), cat('c2')],
      },
    });

    mountWriter(store);

    expect(search().get('r1')).toBe('ab');
    expect(search().get('r2')).toBe('ba');
    expect(search().has('r3')).toBe(false);
  });
});
