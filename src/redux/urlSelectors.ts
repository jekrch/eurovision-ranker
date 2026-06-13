import { createSelector } from '@reduxjs/toolkit';

import { AppState } from './store';
import { encodeRankingsToURL } from '../utilities/UrlUtil';

/**
 * The canonical URL parameter set projected from the store — the inverse of
 * `extractParams`. The store is the single source of truth; the URL is a pure
 * projection of it.
 *
 * Each entry is the desired value for that key, or `undefined` when the key
 * should be absent. Values are kept byte-for-byte compatible with the existing
 * URL format (falsy / default values project to `undefined` so share links stay
 * clean and the encode/decode round-trip is unchanged): an absent `cm`/`pl`/`g`
 * decodes the same as the explicit `f`/false it replaces.
 *
 * Per-category rankings live in `r1`/`r2`/… when categories are defined, or a
 * single `r` otherwise — mirroring how `extractParams` reads them back.
 */
export const selectUrlParams = createSelector(
  [
    (state: AppState) => state.root.name,
    (state: AppState) => state.root.year,
    (state: AppState) => state.root.theme,
    (state: AppState) => state.root.vote,
    (state: AppState) => state.root.showComparison,
    (state: AppState) => state.root.globalSearch,
    (state: AppState) => state.root.showThumbnail,
    (state: AppState) => state.root.showPlace,
    (state: AppState) => state.root.categories,
    (state: AppState) => state.root.categoryRankings,
  ],
  (
    name,
    year,
    theme,
    vote,
    showComparison,
    globalSearch,
    showThumbnail,
    showPlace,
    categories,
    categoryRankings,
  ): Record<string, string | undefined> => {
    const encodeSlot = (slot: number): string | undefined => {
      const encoded = encodeRankingsToURL(categoryRankings[slot] ?? [], globalSearch);
      // encodeRankingsToURL prefixes global rankings with '>'; an empty ranking
      // ('' or just '>') should be absent rather than a stray param.
      return encoded.replace('>', '').length ? encoded : undefined;
    };

    const params: Record<string, string | undefined> = {
      n: name || undefined,
      y: year ? year.slice(-2) : undefined,
      t: theme || undefined,
      // `vote` starts as the 'loading' sentinel before the contestant set
      // resolves; that is never a real URL value.
      v: vote && vote !== 'loading' ? vote : undefined,
      cm: showComparison ? 't' : undefined,
      g: globalSearch ? 't' : undefined,
      // Thumbnails default on, so only the explicit 'f' opt-out is projected.
      p: showThumbnail ? undefined : 'f',
      pl: showPlace ? 't' : undefined,
      c: categories.length
        ? categories.map((category) => `${category.name}-${category.weight}`).join('|')
        : undefined,
    };

    if (categories.length > 0) {
      categories.forEach((_, index) => {
        params[`r${index + 1}`] = encodeSlot(index);
      });
    } else {
      params.r = encodeSlot(0);
    }

    return params;
  },
);
