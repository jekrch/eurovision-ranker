import pako from 'pako';

import { CountryContestant } from '../../../data/CountryContestant';
import { logger } from '../../../utilities/logger';
import { SortState } from '../../../utilities/SorterUtils';

/*
  Serialization + caching primitives for the pairwise sorter. The sorter keeps a
  compressed history of states so the user can step back/forward; these helpers
  handle the (de)compression and the Map/Set-aware JSON encoding.
*/

// modal constants
export const MAX_CACHED_STATES = 25;

// component types
export interface ChoiceLogEntry {
  comparisonIndex: number; // index within state.comparisons when choice was made
  choice: 'left' | 'right';
}

export interface StateCache {
  [index: number]: Uint8Array; // index maps to comparison count (history index)
}

export type NavigationAction = 'choice' | 'back' | 'forward' | 'init' | null;

// json serialization helpers with support for map/set
const jsonReplacer = (key: string, value: unknown) => {
  if (value instanceof Map) return { __dataType: 'Map', value: Array.from(value.entries()) };
  if (value instanceof Set) return { __dataType: 'Set', value: Array.from(value.values()) };
  return value;
};

const jsonReviver = (key: string, value: unknown) => {
  if (typeof value === 'object' && value !== null) {
    const tagged = value as { __dataType?: string; value: [unknown, unknown][] & unknown[] };
    if (tagged.__dataType === 'Map') return new Map(tagged.value);
    if (tagged.__dataType === 'Set') return new Set(tagged.value);
    // add custom revival logic here if CountryContestant or other types need it
  }
  return value;
};

/*
  The sorter holds the same large CountryContestant objects (each carrying a full
  country + contestant + votes) in allItems, comparisons, mergeStack,
  currentMergeStep and currentRanking. Serializing them verbatim duplicates that
  payload several times per cached state. Instead we store allItems once and encode
  every other reference as an index into it, then rehydrate from the decompressed
  allItems on the way back out. This keeps the produced objects byte-identical to a
  plain round-trip while shrinking what pako has to compress.
*/
interface EncodedComparison {
  l: number; // index of leftItem in allItems
  r: number; // index of rightItem in allItems
  c?: 'left' | 'right';
}

interface EncodedMergeStep {
  left: number[];
  right: number[];
  merged: number[];
  leftIndex: number;
  rightIndex: number;
}

interface EncodedState {
  action: SortState['action'];
  isComplete: boolean;
  totalComparisons: number;
  maxRemainingComparisons: number;
  allItems: ReadonlyArray<CountryContestant>;
  comparisons: EncodedComparison[];
  mergeStack: number[][];
  currentMergeStep: EncodedMergeStep | null;
  currentRanking: number[];
}

/*
 * compresses the full sorter state using pako (zlib).
 * allItems is serialized once; all other item references are encoded as indices
 * into it. returns null on error.
 */
export const compressFullState = (state: SortState): Uint8Array | null => {
  try {
    const indexOf = new Map<string, number>();
    state.allItems.forEach((item, idx) => {
      if (item?.uid !== undefined) indexOf.set(item.uid, idx);
    });

    const idx = (item: CountryContestant): number => {
      const found = item?.uid !== undefined ? indexOf.get(item.uid) : undefined;
      if (found === undefined) {
        // every item in the live state references one in allItems; if this ever
        // fails the index encoding would be lossy, so bail out to the error path.
        throw new Error('compressFullState: item not found in allItems');
      }
      return found;
    };

    const encoded: EncodedState = {
      action: state.action,
      isComplete: state.isComplete,
      totalComparisons: state.totalComparisons,
      maxRemainingComparisons: state.maxRemainingComparisons,
      allItems: state.allItems,
      comparisons: state.comparisons.map((c) => {
        const enc: EncodedComparison = { l: idx(c.leftItem), r: idx(c.rightItem) };
        if (c.choice) enc.c = c.choice;
        return enc;
      }),
      mergeStack: state.mergeStack.map((list) => list.map(idx)),
      currentMergeStep: state.currentMergeStep
        ? {
            left: state.currentMergeStep.left.map(idx),
            right: state.currentMergeStep.right.map(idx),
            merged: state.currentMergeStep.merged.map(idx),
            leftIndex: state.currentMergeStep.leftIndex,
            rightIndex: state.currentMergeStep.rightIndex,
          }
        : null,
      currentRanking: state.currentRanking.map(idx),
    };

    const jsonString = JSON.stringify(encoded, jsonReplacer);
    const compressed = pako.deflate(jsonString);
    return compressed;
  } catch (e) {
    logger.error('error compressing full state:', e);
    return null;
  }
};

/*
 * decompresses the sorter state using pako (zlib).
 * rehydrates index references against the stored allItems and re-freezes array
 * structures for consistency. returns null on error or empty input.
 */
export const decompressFullState = (compressedData: Uint8Array): SortState | null => {
  if (!compressedData || compressedData.length === 0) return null;
  try {
    const jsonString = pako.inflate(compressedData, { to: 'string' });
    const encoded = JSON.parse(jsonString, jsonReviver) as EncodedState;

    const allItems = Object.freeze(encoded.allItems || []);
    const at = (index: number): CountryContestant => allItems[index];

    const state: SortState = {
      action: encoded.action,
      isComplete: encoded.isComplete,
      totalComparisons: encoded.totalComparisons,
      maxRemainingComparisons: encoded.maxRemainingComparisons,
      allItems,
      comparisons: (encoded.comparisons || []).map((c) => ({
        leftItem: at(c.l),
        rightItem: at(c.r),
        ...(c.c ? { choice: c.c } : {}),
      })), // comparisons array is mutable within copies
      mergeStack: encoded.mergeStack
        ? Object.freeze(encoded.mergeStack.map((list) => Object.freeze((list || []).map(at))))
        : Object.freeze([]),
      currentMergeStep: encoded.currentMergeStep
        ? {
            left: Object.freeze((encoded.currentMergeStep.left || []).map(at)),
            right: Object.freeze((encoded.currentMergeStep.right || []).map(at)),
            merged: (encoded.currentMergeStep.merged || []).map(at), // mutable within steps
            leftIndex: encoded.currentMergeStep.leftIndex,
            rightIndex: encoded.currentMergeStep.rightIndex,
          }
        : null,
      currentRanking: (encoded.currentRanking || []).map(at), // final ranking is a plain array copy
    };
    return state;
  } catch (e) {
    logger.error('error decompressing full state:', e);
    return null;
  }
};
