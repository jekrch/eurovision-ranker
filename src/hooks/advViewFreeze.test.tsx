// @vitest-environment jsdom
import { render, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CountryContestant } from '../data/CountryContestant';

// Only the data I/O boundary is stubbed; every URL/ranking utility runs for real
// so the competing writers race exactly as they do in the app.
vi.mock('../utilities/CsvCache', () => ({ fetchContestantCsv: vi.fn() }));
vi.mock('../utilities/ContestantRepository', () => ({
  getCountryContestantsByUids: vi.fn(async (uids: string[]) => uids.map((uid) => cc(uid))),
}));

import { useContestantTable } from './useContestantTable';
import { useUrlWriter } from './useUrlWriter';
import {
  setShowTotalRank,
  setActiveCategory,
  setShowUnranked,
  setSelectedContestants,
} from '../redux/rootSlice';
import { useAppDispatch, useAppSelector } from './stateHooks';
import { AppState } from '../redux/store';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

function cc(uid: string): CountryContestant {
  return {
    id: uid,
    uid,
    country: { id: uid, name: `Country ${uid}`, key: uid } as never,
    contestant: null,
  };
}
const rrow = (uid: string) => ({
  id: uid,
  year: 2026,
  to_country_id: uid,
  to_country: `Country ${uid}`,
  performer: `Performer ${uid}`,
  song: `Song ${uid}`,
  place_contest: 1,
});

const slot0 = ['adb', 'aae', 'bpb', 'bpx', 'bpm', 'bps', 'bqc', 'bpl', 'bpn', 'bph', 'box', 'bov', 'aag'];
const slot1 = ['bpb', 'adb', 'bpx', 'bpm', 'bps', 'bpl', 'bqc', 'bpn', 'bph', 'bov', 'box', 'aag', 'aaf'];
const slot2 = [...slot1, 'aae', 'boy', 'bpa', 'bpc', 'bpd', 'bpe', 'bpf', 'bpi', 'bpk', 'bpp', 'bpr'];
const allUids = Array.from(new Set([...slot0, ...slot1, ...slot2]));

// Mirror App's "leaving Total for the select view" effect and useUrlSync's
// boot bootstrap, the two app-level effects that interact with the table hook.
function Harness() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s: AppState) => s.root.categories);
  const activeCategory = useAppSelector((s: AppState) => s.root.activeCategory);
  const showUnranked = useAppSelector((s: AppState) => s.root.showUnranked);
  const showTotalRank = useAppSelector((s: AppState) => s.root.showTotalRank);

  useEffect(() => {
    if (categories.length > 0 && activeCategory === undefined && categories.length > 1) {
      dispatch(setShowTotalRank(true));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories]);

  useEffect(() => {
    if (showUnranked && categories?.length > 0 && showTotalRank) {
      dispatch(setShowTotalRank(false));
      dispatch(setActiveCategory(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnranked]);

  const readyRef = React.useRef(true);
  useUrlWriter({ readyRef });
  useContestantTable();
  return null;
}

describe('advanced view with multiple categories', () => {
  beforeEach(() => vi.clearAllMocks());

  it('settles after adding a contestant instead of rewriting history endlessly', async () => {
    const search =
      '?y=26&n=Test&v=f-tv&c=Original-5|Televote: Belgium-0|Televote: Belgium-0&g=t' +
      `&r1=>${slot0.join('')}&r2=>${slot1.join('')}&r3=>${slot2.join('')}`;
    window.history.replaceState(null, '', '/' + search);

    const store = makeTestStore({
      root: {
        name: 'Test',
        year: '2026',
        vote: 'f-tv',
        globalSearch: true,
        showTotalRank: true,
        activeCategory: undefined,
        categories: [
          { name: 'Original', weight: 5 },
          { name: 'Televote: Belgium', weight: 0 },
          { name: 'Televote: Belgium', weight: 0 },
        ],
        categoryRankings: [slot0.map(cc), slot1.map(cc), slot2.map(cc)],
      },
      table: { tableState: { entries: [...allUids, 'new1'].map(rrow) } },
    });

    const pushSpy = vi.spyOn(window.history, 'pushState');

    render(<Harness />, { wrapper: storeWrapper(store) });
    await act(async () => {
      await new Promise((r) => setTimeout(r, 200));
    });

    // user clicks "select" to enter the advanced view, then adds a contestant
    pushSpy.mockClear();
    await act(async () => {
      store.dispatch(setShowUnranked(true));
      await new Promise((r) => setTimeout(r, 100));
    });
    await act(async () => {
      const selected = store.getState().table.tableState.selectedContestants;
      store.dispatch(setSelectedContestants([...selected, rrow('new1')]));
      await new Promise((r) => setTimeout(r, 1000));
    });

    // a runaway loop hammers history.pushState; a healthy reconcile settles fast
    expect(pushSpy.mock.calls.length).toBeLessThan(20);
  });
});
