// Helpers for the `ranking` field, which holds the full URL query string
// of a saved ranking (r, r1, r2, c, v, t, …) minus name/year (stored as
// dedicated columns) and routing-only params (id, signup).

export const MAX_RANKING_LENGTH = 500;

// Params that are stored as dedicated UserRanking columns and so are excluded
// from the `ranking` blob.
const DEDICATED_KEYS = ['n', 'y'];
// Routing/auth params that should never be persisted.
const TRANSIENT_KEYS = ['id', 'signup'];

function stripKeys(sp: URLSearchParams, keys: string[]) {
  for (const k of keys) sp.delete(k);
}

// Build the value to store in the `ranking` field from the current URL.
export function buildRankingParamsFromUrl(search: string = window.location.search): string {
  const sp = new URLSearchParams(search);
  stripKeys(sp, DEDICATED_KEYS);
  stripKeys(sp, TRANSIENT_KEYS);
  return sp.toString();
}

// Detect the new query-string format. Legacy values are the raw encoded
// ranking (e.g. `cy.lg.ggbno` or `>cy...`), which never contains `=`.
function isQueryStringFormat(ranking: string): boolean {
  return ranking.includes('=');
}

// Parse a stored `ranking` value into URLSearchParams, transparently handling
// the legacy raw-r format.
export function parseStoredRanking(ranking: string): URLSearchParams {
  if (!ranking) return new URLSearchParams();
  if (isQueryStringFormat(ranking)) return new URLSearchParams(ranking);
  const sp = new URLSearchParams();
  sp.set('r', ranking);
  return sp;
}

// Normalize a stored `ranking` value into the new query-string form so it
// compares apples-to-apples against `buildRankingParamsFromUrl()` output.
export function normalizeStoredRanking(ranking: string): string {
  if (!ranking) return '';
  if (isQueryStringFormat(ranking)) return ranking;
  return parseStoredRanking(ranking).toString();
}
