import { UserRanking } from './types';

export interface RankingSignatureInput {
    name: string;
    description: string;
    year: string;
    ranking: string;
    voteCode: string;
    isPublic: boolean;
}

export function buildSignature(input: RankingSignatureInput): string {
    return [
        input.name ?? '',
        input.description ?? '',
        input.year ?? '',
        input.ranking ?? '',
        input.voteCode ?? '',
        input.isPublic ? '1' : '0',
    ].join('|');
}

export function signatureFromRanking(r: UserRanking, voteCode: string = ''): string {
    return buildSignature({
        name: r.name ?? '',
        description: r.description ?? '',
        year: r.year != null ? String(r.year) : '',
        ranking: r.ranking ?? '',
        voteCode,
        isPublic: !!r.public,
    });
}
