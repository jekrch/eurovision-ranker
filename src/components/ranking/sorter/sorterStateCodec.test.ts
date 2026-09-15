import pako from 'pako';
import { describe, it, expect } from 'vitest';

import { compressFullState, decompressFullState } from './sorterStateCodec';
import type { CountryContestant } from '../../../data/CountryContestant';
import { initSortState, processChoice, getCurrentComparison } from '../../../utilities/SorterUtils';

const make = (id: string): CountryContestant => ({
  uid: id,
  id,
  country: { key: id.toLowerCase(), name: `Country ${id}`, id, icon: `icon-${id}` } as any,
  contestant: {
    id,
    artist: `Artist ${id}`,
    song: `Song ${id}`,
    year: '2024',
    youtube: 'https://youtube.com',
    countryKey: id.toLowerCase(),
  } as any,
});

// a state and its serialized-then-restored form must be indistinguishable to the
// rest of the app, so compare by value the way consumers read the state.
const value = (state: unknown) => JSON.parse(JSON.stringify(state));

describe('sorter state codec', () => {
  it('restores a state identical to the one that was compressed, at every step of a sort', () => {
    const items = Array.from({ length: 12 }, (_, i) => make(`C${i}`));
    let state = initSortState(items);

    let guard = 0;
    while (!state.isComplete && guard++ < 1000) {
      const compressed = compressFullState(state);
      expect(compressed).not.toBeNull();
      const restored = decompressFullState(compressed!);

      expect(restored).not.toBeNull();
      expect(value(restored)).toEqual(value(state));

      const cmp = getCurrentComparison(state);
      expect(cmp).toBeDefined();
      // deterministic choice so the walk is reproducible
      state = processChoice(state, cmp!.leftItem.uid! < cmp!.rightItem.uid! ? 'left' : 'right');
    }

    expect(state.isComplete).toBe(true);
    const final = decompressFullState(compressFullState(state)!);
    expect(value(final)).toEqual(value(state));
  });
});

describe('a sorter state that cannot be stored', () => {
  it('is reported rather than stored half-encoded', () => {
    const items = Array.from({ length: 4 }, (_, i) => make(`C${i}`));
    const state = initSortState(items);
    // a comparison against an item the sort never knew about
    const stray = make('STRAY');
    const broken = {
      ...state,
      comparisons: [...state.comparisons, { leftItem: stray, rightItem: items[0]! }],
    };

    expect(compressFullState(broken as typeof state)).toBeNull();
  });
});

describe('a stored sorter state that cannot be read back', () => {
  it('is reported when there is nothing stored', () => {
    expect(decompressFullState(new Uint8Array())).toBeNull();
  });

  it('is reported when the stored bytes are not a sorter state', () => {
    expect(decompressFullState(new Uint8Array([1, 2, 3, 4]))).toBeNull();
  });

  it('restores what it can from a state stored without its optional parts', () => {
    const items = Array.from({ length: 3 }, (_, i) => make(`C${i}`));
    const stored = pako.deflate(
      JSON.stringify({
        action: 'init',
        isComplete: false,
        totalComparisons: 0,
        maxRemainingComparisons: 3,
        allItems: items,
      }),
    );

    const restored = decompressFullState(stored);

    expect(restored).toMatchObject({
      comparisons: [],
      mergeStack: [],
      currentMergeStep: null,
      currentRanking: [],
    });
    expect(restored!.allItems).toHaveLength(3);
  });
});
