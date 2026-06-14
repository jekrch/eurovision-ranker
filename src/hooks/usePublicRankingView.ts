import React from 'react';
import toast from 'react-hot-toast';

import {
  setName,
  setYear,
  setShowUnranked,
  setCurrentRankingId,
  setLastSavedSignature,
  setLoadedAuthor,
  enterPublicView,
  exitPublicView,
} from '../redux/rootSlice';
import { AppDispatch } from '../redux/store';
import { getToken } from '../utilities/api/client';
import { parseStoredRanking } from '../utilities/api/rankingParams';
import { getPublicRanking, getRanking } from '../utilities/api/rankings';
import { signatureFromRanking } from '../utilities/api/rankingSignature';
import { ApiError } from '../utilities/api/types';
import { loadRankingsFromURL } from '../utilities/UrlUtil';

interface PublicRankingViewArgs {
  activeCategory: number | undefined;
  dispatch: AppDispatch;
  // Armed once hydration completes so the single URL writer may begin projecting
  // the store. For a `?id=` boot the writer must stay idle until the shared
  // ranking is loaded and `viewMode` is set to 'public'; arming here at the end
  // of the load avoids the writer clobbering the share link mid-fetch.
  writerReadyRef: React.MutableRefObject<boolean>;
}

/**
 * Owns the "public-view-by-id" mode used when the URL is just `?id=<ranking_id>`.
 * The ranking is loaded into the store and `viewMode` is flipped to 'public' as
 * the final step, so the single URL writer projects just `?id=`; the first user
 * edit flips `viewMode` back to 'normal' (a reducer concern — see leavePublicView
 * in rootSlice), and the writer then expands the URL to the full param set.
 */
export function usePublicRankingView({
  activeCategory,
  dispatch,
  writerReadyRef,
}: PublicRankingViewArgs) {
  async function loadPublicRankingById(id: string) {
    try {
      // When signed in, use the authenticated endpoint: it returns the
      // caller's own rankings, public rankings, and non-public rankings shared
      // with a group they belong to. Anonymous visitors get public-only.
      const full = getToken() ? await getRanking(id) : await getPublicRanking(id);
      const loadedName = full.name || '';
      const loadedYear = full.year != null ? String(full.year) : '';
      const yearShort = full.year != null ? String(full.year).slice(-2) : undefined;

      // Temporarily replace the URL search with the saved params + n/y so
      // loadRankingsFromURL can read them; the URL writer projects the tidy
      // `?id=…` once viewMode flips to 'public' below.
      // `full.ranking` may be the new query-string format (e.g. r=…&r1=…&v=…)
      // or the legacy raw r-value — parseStoredRanking handles both.
      const sp = parseStoredRanking(full.ranking ?? '');
      if (loadedName) sp.set('n', loadedName);
      if (yearShort) sp.set('y', yearShort);
      sp.set('id', id);
      window.history.pushState(null, '', '?' + sp.toString());

      dispatch(setName(loadedName));
      if (loadedYear) dispatch(setYear(loadedYear));

      await loadRankingsFromURL(activeCategory, dispatch);

      dispatch(setShowUnranked(false));

      // Tie into the shared dirty-tracking mechanism so the header can show a
      // subtle "loaded ranking by <author>" indicator that disappears on the
      // first edit (when the live signature diverges from this baseline).
      dispatch(setCurrentRankingId(full.ranking_id));
      dispatch(setLastSavedSignature(signatureFromRanking(full)));
      dispatch(
        setLoadedAuthor({
          username: full.author_username,
          email: full.author_email,
          userId: full.user_id,
        }),
      );

      // Final step: enter public view so the writer projects just `?id=`. All the
      // hydrating dispatches above ran while viewMode was still 'normal', so they
      // didn't trip leavePublicView — only a later user edit will.
      dispatch(enterPublicView(id));
      // The store now reflects the share link; safe to let the writer project it.
      writerReadyRef.current = true;
    } catch (e) {
      // Never entered public view, so just clear any loaded author and let the
      // (now-armed) writer drop the stray `id` by projecting the normal state.
      dispatch(exitPublicView());
      dispatch(setLoadedAuthor(null));
      writerReadyRef.current = true;
      if (e instanceof ApiError && e.status === 404) {
        toast.error('That ranking is not available.');
      } else if (e instanceof ApiError) {
        toast.error(e.body?.trim() || 'Failed to load ranking.');
      } else {
        toast.error('Failed to load ranking.');
      }
    }
  }

  return { loadPublicRankingById };
}
