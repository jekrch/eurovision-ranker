import { UserRanking } from './types';
import { normalizeStoredRanking } from './rankingParams';

export interface RankingSignatureInput {
    name: string;
    description: string;
    year: string;
    ranking: string;
    isPublic: boolean;
}

export function buildSignature(input: RankingSignatureInput): string {
    return [
        input.name ?? '',
        input.description ?? '',
        input.year ?? '',
        input.ranking ?? '',
        input.isPublic ? '1' : '0',
    ].join('|');
}

export function signatureFromRanking(r: UserRanking): string {
    // description and public are not part of the editable local state, so
    // exclude them from the signature. Otherwise loading a saved ranking
    // that's public (or has a description) would immediately register as
    // "dirty" since the current-state signature uses '' and false for these.
    return buildSignature({
        name: r.name ?? '',
        description: '',
        year: r.year != null ? String(r.year) : '',
        ranking: normalizeStoredRanking(r.ranking ?? ''),
        isPublic: false,
    });
}
