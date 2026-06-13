import React, { useEffect } from 'react';

import { useAppSelector } from './stateHooks';
import { selectUrlParams } from '../redux/urlSelectors';

/**
 * Static params this writer authors, projected from the store. The per-category
 * rankings (`r` / `r1`..`rN`) are also authored here but handled dynamically
 * since their key count tracks the categories. The remaining canonical params
 * (t/v/cm/p/pl/c) are still written by their own components and will fold into
 * this writer as those ad-hoc callers are removed.
 */
const MANAGED_KEYS = ['n', 'y', 'g'] as const;

// Matches the per-category ranking params: the bare `r` and the indexed
// `r1`, `r2`, … The writer owns all of them, projecting them from the store's
// categoryRankings.
const RANKING_KEY = /^r\d*$/;

interface UseUrlWriterArgs {
  // Armed once the store has been hydrated from the URL on boot. Until then the
  // store is empty, so projecting it would clobber the share link we are booting
  // from — the writer stays idle until hydration completes.
  readyRef: React.MutableRefObject<boolean>;
  // While public-view-by-id is active the URL is just `?id=…`; suppress writes so
  // the share URL stays tidy. (A `viewMode` store field will eventually replace
  // this ref, which the writer would then read instead.)
  publicViewActiveRef: React.MutableRefObject<boolean>;
  // Bumped by the app whenever a manual ranking edit occurs. Public view exits on
  // the first edit, but the exit and the store edit land in separate commits, so
  // the store change alone can fire the writer while it is still suppressed. This
  // signal re-runs the writer on the edit commit — after the suppression clears —
  // so the freshly edited ranking is projected.
  editNonce?: number;
}

/**
 * The single store -> URL writer. The store is the source of truth and the URL
 * is a pure projection of it: one subscriber diffs the projected params against
 * the current URL and pushes a single history entry when they differ. This
 * replaces the scattered `updateQueryParams` calls that previously wrote these
 * params from useUrlSync, App's refresh effect, and the global-search toggle.
 *
 * Only the managed keys are touched, so unrelated params the store does not own
 * (`id`, `quiz`, deep-link tokens, and params still owned by other components)
 * are preserved untouched.
 */
export function useUrlWriter({ readyRef, publicViewActiveRef, editNonce = 0 }: UseUrlWriterArgs) {
  const urlParams = useAppSelector(selectUrlParams);

  // The ranking keys present in the projection (`r` or `r1`..`rN`); their count
  // tracks the categories, so they can't live in a static list.
  const rankingKeys = Object.keys(urlParams).filter((key) => RANKING_KEY.test(key));

  // Re-run the writer exactly when a value it authors changes.
  const signature = [...MANAGED_KEYS, ...rankingKeys]
    .map((key) => `${key}=${urlParams[key] ?? ''}`)
    .join('&');

  useEffect(() => {
    if (!readyRef.current) return;
    if (publicViewActiveRef.current) return;

    const searchParams = new URLSearchParams(window.location.search);

    MANAGED_KEYS.forEach((key) => {
      const value = urlParams[key];
      if (value) searchParams.set(key, value);
      else searchParams.delete(key);
    });

    // Ranking params are rewritten wholesale: drop every existing one (so stale
    // slots like an `r3` from a deleted category, or a leftover `r` after
    // categories are defined, disappear) then set the projected set.
    [...searchParams.keys()]
      .filter((key) => RANKING_KEY.test(key))
      .forEach((key) => searchParams.delete(key));
    rankingKeys.forEach((key) => {
      const value = urlParams[key];
      if (value) searchParams.set(key, value);
    });

    const newUrl = '?' + searchParams.toString();
    if (newUrl !== window.location.search) {
      window.history.pushState(null, '', newUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, editNonce]);
}
