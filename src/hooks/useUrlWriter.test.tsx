// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';

import { useUrlWriter } from './useUrlWriter';
import { CountryContestant } from '../data/CountryContestant';
import { setName, setYear, setGlobalSearch, setRankedItems } from '../redux/rootSlice';
import { makeTestStore, TestStore, storeWrapper } from '../test/storeHarness';
import { Category } from '../utilities/CategoryUtil';

const cc = (id: string): CountryContestant =>
  ({ id, uid: id, country: { id, key: id, name: id }, contestant: null }) as CountryContestant;
const cat = (name: string) => ({ name, weight: 5 }) as Category;

/**
 * The single store -> URL writer projects the store's canonical params onto the
 * URL. It is the only thing that writes those params, and it leaves params the
 * store does not own (deep-link tokens) untouched. It does nothing until armed
 * (boot hydration complete). In public-view mode the projection collapses to
 * just `?id=`; the store's `viewMode`, not a ref, drives that.
 */

const ref = (value: boolean): React.MutableRefObject<boolean> => ({ current: value });

const setUrl = (search: string) => window.history.replaceState(null, '', search);
const search = () => new URLSearchParams(window.location.search);

function mountWriter(store: TestStore, opts: { ready?: boolean } = {}) {
  const readyRef = ref(opts.ready ?? true);
  return renderHook(() => useUrlWriter({ readyRef }), {
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
    setUrl('/?quiz=abc');
    const store = makeTestStore({ root: { name: 'Bob' } });

    mountWriter(store);

    expect(search().get('quiz')).toBe('abc');
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

  it('projects only ?id= in public-view mode, hiding the rest of the state', () => {
    setUrl('/?id=xyz');
    const store = makeTestStore({
      root: {
        viewMode: 'public',
        publicViewId: 'xyz',
        name: 'Bob',
        year: '2023',
        categoryRankings: [[cc('a'), cc('b')]],
      },
    });

    mountWriter(store);

    expect(search().get('id')).toBe('xyz');
    expect(search().has('n')).toBe(false);
    expect(search().has('y')).toBe(false);
    expect(search().has('r')).toBe(false);
  });

  it('drops id and projects the full set once an edit leaves public view', () => {
    setUrl('/?id=xyz');
    const store = makeTestStore({
      root: {
        viewMode: 'public',
        publicViewId: 'xyz',
        name: 'Bob',
        categoryRankings: [[cc('a'), cc('b')]],
      },
    });

    mountWriter(store);
    expect(search().get('id')).toBe('xyz');

    // A ranking edit flips viewMode back to 'normal' (a reducer concern); the
    // writer re-runs, drops the share id, and expands to the full param set.
    act(() => {
      store.dispatch(setRankedItems([cc('b'), cc('a')]));
    });

    expect(search().has('id')).toBe(false);
    expect(search().get('n')).toBe('Bob');
    expect(search().get('r')).toBe('ba');
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

  it('re-encodes the ranking from country-id to global-uid form when global mode flips', () => {
    // Store items carry both the country id and the global uid, so flipping
    // global mode re-projects the ranking in the new mode with no URL round-trip
    // — this is what lets the writer own the advanced-mode toggle outright.
    const item = (id: string, uid: string): CountryContestant =>
      ({ id, uid, country: { id, key: id, name: id }, contestant: null }) as CountryContestant;
    const store = makeTestStore({
      root: {
        categoryRankings: [[item('a', 'a01'), item('b', 'b02')]],
        categories: [],
        globalSearch: false,
      },
    });

    mountWriter(store);
    expect(search().get('r')).toBe('ab');

    act(() => {
      store.dispatch(setGlobalSearch(true));
    });

    expect(search().get('r')).toBe('>a01b02');
    expect(search().get('g')).toBe('t');
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
