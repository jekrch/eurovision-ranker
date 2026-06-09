import { useRef } from 'react';
import toast from 'react-hot-toast';
import { AppDispatch } from '../redux/store';
import {
    setName,
    setYear,
    setShowUnranked,
    setCurrentRankingId,
    setLastSavedSignature,
    setLoadedAuthor,
} from '../redux/rootSlice';
import { loadRankingsFromURL, updateQueryParams } from '../utilities/UrlUtil';
import { getPublicRanking, getRanking } from '../utilities/api/rankings';
import { getToken } from '../utilities/api/client';
import { parseStoredRanking } from '../utilities/api/rankingParams';
import { signatureFromRanking } from '../utilities/api/rankingSignature';
import { ApiError } from '../utilities/api/types';

interface PublicRankingViewArgs {
    activeCategory: number | undefined;
    name: string;
    year: string;
    dispatch: AppDispatch;
}

/**
 * Owns the "public-view-by-id" mode used when the URL is just `?id=<ranking_id>`.
 * While active, App suppresses its n/y/r URL-writing effects so the share URL
 * stays tidy; the first user-initiated change exits the mode and re-syncs.
 *
 * Returns the mode refs (read by App's n/y/refreshUrl effects) plus the
 * load/exit actions. The functions are recreated each render so they close over
 * the latest name/year/activeCategory, matching the original in-component logic.
 */
export function usePublicRankingView({ activeCategory, name, year, dispatch }: PublicRankingViewArgs) {
    const publicViewActiveRef = useRef(false);
    const publicViewLoadedRef = useRef(false);
    const loadedNameRef = useRef<string>('');
    const loadedYearRef = useRef<string>('');

    async function loadPublicRankingById(id: string) {
        try {
            // When signed in, use the authenticated endpoint: it returns the
            // caller's own rankings, public rankings, and non-public rankings shared
            // with a group they belong to. Anonymous visitors get public-only.
            const full = getToken() ? await getRanking(id) : await getPublicRanking(id);
            const loadedName = full.name || '';
            const loadedYear = full.year != null ? String(full.year) : '';
            const yearShort = full.year != null ? String(full.year).slice(-2) : undefined;

            loadedNameRef.current = loadedName;
            loadedYearRef.current = loadedYear;
            // Mark loaded *before* dispatching so the n/y useEffects, which fire
            // after the dispatches, can compare against the loaded values rather
            // than treating themselves as user actions.
            publicViewLoadedRef.current = true;

            // Temporarily replace the URL search with the saved params + n/y so
            // loadRankingsFromURL can read them, then strip back to ?id=<id> below.
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

            // Keep the URL tidy: just ?id=<id>. The n/y/refreshUrl effects below
            // check publicViewActiveRef and won't write back.
            window.history.pushState(null, '', '?id=' + encodeURIComponent(id));

            dispatch(setShowUnranked(false));

            // Tie into the shared dirty-tracking mechanism so the header can show a
            // subtle "loaded ranking by <author>" indicator that disappears on the
            // first edit (when the live signature diverges from this baseline).
            dispatch(setCurrentRankingId(full.ranking_id));
            dispatch(setLastSavedSignature(signatureFromRanking(full)));
            dispatch(setLoadedAuthor({
                username: full.author_username,
                email: full.author_email,
                userId: full.user_id,
            }));
        } catch (e) {
            publicViewActiveRef.current = false;
            publicViewLoadedRef.current = false;
            dispatch(setLoadedAuthor(null));
            if (e instanceof ApiError && e.status === 404) {
                toast.error('That ranking is not available.');
            } else if (e instanceof ApiError) {
                toast.error(e.body?.trim() || 'Failed to load ranking.');
            } else {
                toast.error('Failed to load ranking.');
            }
            updateQueryParams({ id: undefined });
        }
    }

    function exitPublicView() {
        publicViewActiveRef.current = false;
        // Restore n/y in URL since we suppressed those writes while in public view.
        updateQueryParams({
            id: undefined,
            n: name || undefined,
            y: year ? year.slice(-2) : undefined,
        });
    }

    return {
        publicViewActiveRef,
        publicViewLoadedRef,
        loadedNameRef,
        loadedYearRef,
        loadPublicRankingById,
        exitPublicView,
    };
}
