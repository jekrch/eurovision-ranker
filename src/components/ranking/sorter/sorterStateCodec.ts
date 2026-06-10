import pako from 'pako';

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
 * compresses the full sorter state using pako (zlib).
 * returns null on error.
 */
export const compressFullState = (state: SortState): Uint8Array | null => {
  try {
    const jsonString = JSON.stringify(state, jsonReplacer);
    const compressed = pako.deflate(jsonString);
    return compressed;
  } catch (e) {
    logger.error('error compressing full state:', e);
    return null;
  }
};

/*
 * decompresses the sorter state using pako (zlib).
 * re-freezes array structures for consistency.
 * returns null on error or empty input.
 */
export const decompressFullState = (compressedData: Uint8Array): SortState | null => {
  if (!compressedData || compressedData.length === 0) return null;
  try {
    const jsonString = pako.inflate(compressedData, { to: 'string' });
    const state = JSON.parse(jsonString, jsonReviver) as SortState;

    // re-freeze arrays after decompression
    const freezedState: SortState = {
      ...state,
      allItems: Object.freeze(state.allItems || []),
      comparisons: state.comparisons || [], // comparisons array is mutable within copies
      mergeStack: state.mergeStack
        ? Object.freeze(state.mergeStack.map((list) => Object.freeze(list || [])))
        : Object.freeze([]),
      currentMergeStep: state.currentMergeStep
        ? {
            ...state.currentMergeStep,
            left: Object.freeze(state.currentMergeStep.left || []),
            right: Object.freeze(state.currentMergeStep.right || []),
            merged: state.currentMergeStep.merged || [], // merged array is mutable within steps
          }
        : null,
      currentRanking: state.currentRanking || [], // final ranking is a plain array copy
    };
    return freezedState;
  } catch (e) {
    logger.error('error decompressing full state:', e);
    return null;
  }
};
