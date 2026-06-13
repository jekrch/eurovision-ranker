// @vitest-environment jsdom
import { render, act } from '@testing-library/react';
import React, { useEffect } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { CountryContestant } from '../data/CountryContestant';

vi.mock('../utilities/CsvCache', () => ({ fetchContestantCsv: vi.fn() }));

// A deliberately SLOW lookup widens the async window in the reconcile effect,
// the way a throttled network does in the browser — this is what lets
// overlapping effect runs race while the active category is switched underneath.
vi.mock('../utilities/ContestantRepository', () => ({
  getCountryContestantsByUids: vi.fn(
    (uids: string[]) =>
      new Promise((resolve) => setTimeout(() => resolve(uids.map((uid) => cc(uid))), 40)),
  ),
}));

import { useContestantTable } from './useContestantTable';
import { useUrlWriter } from './useUrlWriter';
import { setActiveCategory, setShowTotalRank } from '../redux/rootSlice';
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

function Harness() {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((s: AppState) => s.root.categories);
  const activeCategory = useAppSelector((s: AppState) => s.root.activeCategory);
  const showUnranked = useAppSelector((s: AppState) => s.root.showUnranked);
  const showTotalRank = useAppSelector((s: AppState) => s.root.showTotalRank);

  useEffect(() => {
    if (showUnranked && categories?.length > 0 && showTotalRank) {
      dispatch(setShowTotalRank(false));
      dispatch(setActiveCategory(0));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showUnranked]);

  const readyRef = React.useRef(true);
  const publicViewActiveRef = React.useRef(false);
  void activeCategory;
  useUrlWriter({ readyRef, publicViewActiveRef });
  useContestantTable();
  return null;
}

describe('rapidly switching categories in the advanced view', () => {
  beforeEach(() => vi.clearAllMocks());

  it('settles the ranking without a runaway write loop', async () => {
    const store = makeTestStore({
      root: {
        globalSearch: true,
        showTotalRank: false,
        activeCategory: 0,
        showUnranked: true,
        categories: [
          { name: 'Original', weight: 5 },
          { name: 'Televote: Belgium', weight: 0 },
          { name: 'Televote: Belgium', weight: 0 },
        ],
        categoryRankings: [slot0.map(cc), slot1.map(cc), slot2.map(cc)],
      },
      table: { tableState: { entries: allUids.map(rrow) } },
    });

    const pushSpy = vi.spyOn(window.history, 'pushState');
    render(<Harness />, { wrapper: storeWrapper(store) });

    // hammer the category tabs faster than the (slow) reconcile can finish
    await act(async () => {
      for (let i = 0; i < 12; i++) {
        store.dispatch(setActiveCategory(i % 3));
        await new Promise((r) => setTimeout(r, 10)); // < the 40ms fetch
      }
      // then let everything drain
      await new Promise((r) => setTimeout(r, 1500));
    });

    expect(pushSpy.mock.calls.length).toBeLessThan(40);
  });

  it('settles when the selectable pool is missing some ranked contestants', async () => {
    // The real freeze: the ranked categories contain contestants that are not in
    // the table's entry pool, so the seed selects only a subset and the reconcile
    // wants to drop the rest. The old append/remove pair could not converge and
    // dispatched removeCountryFromCategories in a tight loop.
    const store = makeTestStore({
      root: {
        globalSearch: true,
        showTotalRank: false,
        activeCategory: 0,
        showUnranked: true,
        categories: [
          { name: 'Original', weight: 5 },
          { name: 'Televote: Belgium', weight: 0 },
          { name: 'Televote: Belgium', weight: 0 },
        ],
        categoryRankings: [slot0.map(cc), slot1.map(cc), slot2.map(cc)],
      },
      // entries (the selectable pool) is missing ~half of the ranked uids
      table: { tableState: { entries: slot0.slice(0, 6).map(rrow) } },
    });

    const pushSpy = vi.spyOn(window.history, 'pushState');
    render(<Harness />, { wrapper: storeWrapper(store) });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 1500));
    });

    // converges to a single projection rather than storming
    expect(pushSpy.mock.calls.length).toBeLessThan(40);

    const slots = store.getState().root.categoryRankings;
    const membership = slot0.slice(0, 6);
    // the reconcile actually ran: the active category is trimmed to exactly the 6
    // selectable contestants (proving the effects fired, not a vacuous pass)
    expect(slots[0].map((i) => i.uid)).toEqual(membership);
    // every other category shares that membership (each keeps its own order)...
    slots.forEach((slot) => {
      const keys = slot.map((i) => i.uid);
      expect(new Set(keys)).toEqual(new Set(membership));
      // ...with no duplicated entries (the doubled-ranking bug)
      expect(keys.length).toBe(new Set(keys).size);
    });
  });
});
