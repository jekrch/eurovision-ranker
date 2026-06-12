// @vitest-environment jsdom
import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { useRankingDirty } from './useRankingDirty';
import { CountryContestant } from '../data/CountryContestant';
import { buildRankingParamsFromUrl } from '../utilities/api/rankingParams';
import { buildSignature } from '../utilities/api/rankingSignature';
import { makeTestStore, storeWrapper } from '../test/storeHarness';

const cc = (id: string): CountryContestant =>
  ({ id, uid: id, country: { id, key: id, name: id }, contestant: null }) as CountryContestant;

// The signature the hook computes for the given editable state under the
// current (empty) jsdom URL, so the "clean" case can match it exactly.
const signatureFor = (name: string, year: string) =>
  buildSignature({
    name,
    description: '',
    year,
    ranking: buildRankingParamsFromUrl(),
    isPublic: false,
  });

const render = (preloaded: Parameters<typeof makeTestStore>[0]) =>
  renderHook(() => useRankingDirty(), { wrapper: storeWrapper(makeTestStore(preloaded)) });

describe('useRankingDirty', () => {
  it('treats state as dirty when no ranking id is associated', () => {
    const { result } = render({ root: { name: 'Mine', year: '2024', categoryRankings: [[cc('a')]] } });

    expect(result.current.currentRankingId).toBeNull();
    expect(result.current.isDirty).toBe(true);
    expect(result.current.isEmpty).toBe(false);
  });

  it('is not dirty when the live signature matches the last saved signature', () => {
    const { result } = render({
      root: { name: 'Mine', year: '2024', categoryRankings: [[cc('a')]] },
      auth: { currentRankingId: 'r1', lastSavedSignature: signatureFor('Mine', '2024') },
    });

    expect(result.current.isDirty).toBe(false);
    expect(result.current.currentSignature).toBe(signatureFor('Mine', '2024'));
  });

  it('is dirty when the saved signature no longer matches the live state', () => {
    const { result } = render({
      root: { name: 'Renamed', year: '2024', categoryRankings: [[cc('a')]] },
      auth: { currentRankingId: 'r1', lastSavedSignature: signatureFor('Mine', '2024') },
    });

    expect(result.current.isDirty).toBe(true);
  });

  it('reports isEmpty when there are no ranked items', () => {
    const { result } = render({ root: { categoryRankings: [[]] } });

    expect(result.current.isEmpty).toBe(true);
  });
});
