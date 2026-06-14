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
