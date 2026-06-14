// @vitest-environment jsdom
import { render, act, waitFor } from '@testing-library/react';
import React, { useEffect, useRef, useState } from 'react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { useAppDispatch, useAppSelector } from './stateHooks';
import { usePublicRankingView } from './usePublicRankingView';
import { useUrlSync } from './useUrlSync';
import { useUrlWriter } from './useUrlWriter';
import { CountryContestant } from '../data/CountryContestant';
import { selectActiveRankedItems } from '../redux/rankingSelectors';
import { setActiveCategory, setShowTotalRank, setRankedItems } from '../redux/rootSlice';
import { makeTestStore, TestStore } from '../test/storeHarness';
import { handlePopState } from '../utilities/EventListenerUtil';

/**
 * End-to-end tests for the URL <-> Redux sync contract. The URL is the
 * shareable form of a ranking and the store reflects it:
 *
 *  - booting from a URL populates the ranked / unranked split,
 *  - selecting a category shows that category's order,
 *  - editing the ranking writes the URL and pushes a history entry that
 *    back/forward can restore,
 *  - a `?id=` share link loads a public ranking and keeps the tidy URL until
 *    the first edit.
 *
 * The tests drive a harness wired the same way App wires these hooks, against a
 * real store and the real `window.history`; only the contestant data source and
 * the public-ranking API are mocked.
 */

// Deterministic contestant data: single-char ids so URL encoding is predictable
// (`encodeRankingsToURL` joins ids, `convertRankingsStrToArray` splits per char).
const cc = (id: string): CountryContestant =>
  ({
    id,
    uid: id,
    country: { id, name: id, key: id, icon: '' },
    contestant: null,
  }) as CountryContestant;

const yearSet = (): CountryContestant[] => ['a', 'b', 'c', 'd'].map(cc);
const ids = (arr: CountryContestant[]) => arr.map((i) => i.id);

// The ranked / unranked split is resolved against this contestant set.
vi.mock('../utilities/ContestantRepository', () => ({
  fetchCountryContestantsByYear: vi.fn(async () => yearSet()),
  getCountryContestantsByUids: vi.fn(async () => []),
}));

// A `?id=` link pulls the saved ranking from the API; stub the network.
vi.mock('../utilities/api/rankings', () => ({
  getRanking: vi.fn(),
  getPublicRanking: vi.fn(),
}));
vi.mock('../utilities/api/client', () => ({
  getToken: vi.fn(() => null),
}));
vi.mock('react-hot-toast', () => ({ default: { error: vi.fn(), success: vi.fn() } }));

import { getPublicRanking } from '../utilities/api/rankings';

interface HarnessApi {
  // Simulate a drag edit: replace the ranked items and trigger a URL refresh.
  edit: (items: CountryContestant[]) => void;
}

/**
 * Wires the URL-sync hooks the same way App does: a `?id=` link enters public
 * view before `useUrlSync` runs, and an edit re-writes the URL.
 */
function SyncHarness({ apiRef }: { apiRef?: React.MutableRefObject<HarnessApi | null> }) {
  const dispatch = useAppDispatch();
  const year = useAppSelector((s) => s.root.year);
  const categories = useAppSelector((s) => s.root.categories);
  const activeCategory = useAppSelector((s) => s.root.activeCategory);
  const [refreshUrl, setRefreshUrl] = useState(0);
  const writerReadyRef = useRef(false);

  const pub = usePublicRankingView({ activeCategory, dispatch, writerReadyRef });

  // A `?id=` share link loads the public ranking; the load sets viewMode and arms
  // the writer when it completes.
  useEffect(() => {
    const idParam = new URLSearchParams(window.location.search).get('id');
    if (idParam) {
      pub.loadPublicRankingById(idParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On an edit: arm the writer (defensive, for an edit that beats boot) — exactly
  // as App's refresh effect does. The store edit itself is the source of the URL
  // write and flips viewMode out of public view; the writer does the rest.
  useEffect(() => {
    if (refreshUrl === 0) return;
    writerReadyRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshUrl]);

  useUrlSync({
    activeCategory,
    categories,
    year,
    dispatch,
    writerReadyRef,
  });

  // The single store -> URL writer, wired after useUrlSync as App wires it.
  useUrlWriter({ readyRef: writerReadyRef });

  if (apiRef) {
    apiRef.current = {
      edit: (items) => {
        dispatch(setRankedItems(items));
        setRefreshUrl((n) => n + 1);
      },
    };
  }
  return null;
}

function mount(store: TestStore, apiRef?: React.MutableRefObject<HarnessApi | null>) {
  return render(
    <Provider store={store}>
      <SyncHarness apiRef={apiRef} />
    </Provider>,
  );
}

const setUrl = (search: string) => window.history.replaceState(null, '', search);

describe('URL <-> state sync', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (getPublicRanking as ReturnType<typeof vi.fn>).mockReset?.();
    setUrl('/');
  });

  it('boots from ?y=&r= into the right ranked / unranked split', async () => {
    setUrl('/?y=23&r=ab');
    const store = makeTestStore();

    mount(store);

    await waitFor(() => expect(ids(selectActiveRankedItems(store.getState()))).toEqual(['a', 'b']));
    expect(ids(store.getState().root.unrankedItems).sort()).toEqual(['c', 'd']);
  });

  it('selecting a category shows that category order', async () => {
    // Two categories, each with its own order (r1 / r2).
    setUrl('/?y=23&c=A-5|B-5&r1=ab&r2=dc');
    const store = makeTestStore();

    mount(store);

    // Categories load from the `c` param; with more than one, the total tab
    // shows first.
    await waitFor(() => expect(store.getState().root.categories).toHaveLength(2));

    // Category 0 shows the r1 order.
    act(() => {
      store.dispatch(setShowTotalRank(false));
      store.dispatch(setActiveCategory(0));
    });
    await waitFor(() => expect(ids(selectActiveRankedItems(store.getState()))).toEqual(['a', 'b']));

    // Category 1 shows the r2 order.
    act(() => {
      store.dispatch(setActiveCategory(1));
    });
    await waitFor(() => expect(ids(selectActiveRankedItems(store.getState()))).toEqual(['d', 'c']));
  });

  it('editing the ranking writes the URL, pushes history, and back restores the prior order', async () => {
    setUrl('/?y=23&r=ab');
    const store = makeTestStore();
    const apiRef =
      React.createRef<HarnessApi | null>() as React.MutableRefObject<HarnessApi | null>;

    mount(store, apiRef);
    await waitFor(() => expect(ids(selectActiveRankedItems(store.getState()))).toEqual(['a', 'b']));

    const pushSpy = vi.spyOn(window.history, 'pushState');

    // Edit: reorder to [b, a].
    act(() => apiRef.current!.edit([cc('b'), cc('a')]));

    await waitFor(() => expect(new URLSearchParams(window.location.search).get('r')).toBe('ba'));
    expect(pushSpy).toHaveBeenCalled(); // a new history entry was pushed

    // Back navigation: the current URL repopulates the store.
    setUrl('/?y=23&r=ab');
    await act(async () => {
      handlePopState({} as PopStateEvent, () => false, undefined, store.dispatch);
    });
    await waitFor(() => expect(ids(selectActiveRankedItems(store.getState()))).toEqual(['a', 'b']));

    pushSpy.mockRestore();
  });

  it('?id= loads a public ranking, keeps the URL as ?id=, and the first edit exits public view', async () => {
    (getPublicRanking as ReturnType<typeof vi.fn>).mockResolvedValue({
      ranking_id: 'rid1',
      name: 'Shared',
      year: 2023,
      ranking: 'r=ab',
      is_public: true,
      author_username: 'bob',
    });

    setUrl('/?id=xyz');
    const store = makeTestStore();
    const apiRef =
      React.createRef<HarnessApi | null>() as React.MutableRefObject<HarnessApi | null>;

    mount(store, apiRef);

    // Public ranking loads into the store...
    await waitFor(() => expect(ids(selectActiveRankedItems(store.getState()))).toEqual(['a', 'b']));
    // ...and the share URL stays tidy as just ?id=xyz.
    expect(window.location.search).toBe('?id=xyz');

    // The first edit leaves public view: id is dropped, the full param set returns.
    act(() => apiRef.current!.edit([cc('b'), cc('a')]));

    await waitFor(() => {
      const sp = new URLSearchParams(window.location.search);
      expect(sp.has('id')).toBe(false);
      expect(sp.get('r')).toBe('ba');
    });
  });
});
