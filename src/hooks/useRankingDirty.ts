import { useMemo } from 'react';
import { AppState } from '../redux/store';
import { useAppSelector } from './stateHooks';
import { buildSignature } from '../utilities/api/rankingSignature';
import { buildRankingParamsFromUrl } from '../utilities/api/rankingParams';

export interface RankingDirtyState {
    /** Id of the saved/loaded ranking currently in view, or null. */
    currentRankingId: string | null;
    /** The ranking params encoded from the current URL (excludes n/y/id/signup). */
    rankingParams: string;
    /** Signature of the current editable state. */
    currentSignature: string;
    /** True when the current state differs from the last saved/loaded signature. */
    isDirty: boolean;
    /** True when there are no ranked items. */
    isEmpty: boolean;
}

/**
 * Shared dirty-detection for the currently loaded/saved ranking. Compares a
 * signature of the live editable state (name/year/ranking) against the
 * `lastSavedSignature` captured when the ranking was saved or loaded by id.
 *
 * When no ranking is associated (`currentRankingId` is null), the state is
 * treated as dirty so it reads as "unsaved".
 */
export function useRankingDirty(): RankingDirtyState {
    const name = useAppSelector((s: AppState) => s.name);
    const year = useAppSelector((s: AppState) => s.year);
    const rankedItems = useAppSelector((s: AppState) => s.rankedItems);
    const currentRankingId = useAppSelector((s: AppState) => s.currentRankingId);
    const lastSavedSignature = useAppSelector((s: AppState) => s.lastSavedSignature);

    // `rankingParams` reflects everything in the URL except n/y/id/signup.
    // It's recomputed whenever `rankedItems` changes (a proxy for "the URL
    // has been re-synced") so dirty-detection stays live.
    const rankingParams = useMemo(() => buildRankingParamsFromUrl(), [rankedItems]);

    const currentSignature = useMemo(
        () =>
            buildSignature({
                name: name || '',
                description: '',
                year: year || '',
                ranking: rankingParams,
                isPublic: false,
            }),
        [name, year, rankingParams]
    );

    const isDirty = currentRankingId ? lastSavedSignature !== currentSignature : true;
    const isEmpty = rankedItems.length === 0;

    return { currentRankingId, rankingParams, currentSignature, isDirty, isEmpty };
}
