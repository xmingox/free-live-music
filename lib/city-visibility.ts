// lib/city-visibility.ts
//
// Single source of truth for "is this city page thin?" — the index/noindex
// threshold and the predicate for what counts as an indexable upcoming event.
//
// Previously this logic was duplicated and DRIFTED: sitemap.ts used
// CITY_MIN_CONCERTS = 10 on (is_verified && !is_tbd) upcoming rows, while
// the /concerts/[city] metadata used `< 10` on (is_verified) only — so a city
// stuffed with TBA placeholders could be in the sitemap but noindexed, or vice
// versa. Both now import from here.

import { Concert } from '@/types'

/**
 * Minimum indexable upcoming events for a city page to be treated as "healthy"
 * (indexable, not degraded). Below this, the page is noindexed and renders the
 * graceful-degradation fallback (series history, nearby cities, venues).
 */
export const CITY_MIN_UPCOMING = 10

/**
 * Does a concert count as an indexable, real upcoming listing?
 * Excludes TBA/placeholder rows and anything explicitly unverified.
 * (Past/archived filtering is done at the query level via `date >= today`.)
 */
export function isIndexableUpcoming(
  c: Pick<Concert, 'is_verified' | 'is_tbd' | 'is_cancelled'>,
): boolean {
  if (c.is_verified === false) return false
  if (c.is_tbd === true) return false
  if (c.is_cancelled === true) return false
  return true
}

/** Count only the indexable upcoming events in an already date-filtered list. */
export function countIndexable(concerts: Concert[]): number {
  return concerts.reduce((n, c) => (isIndexableUpcoming(c) ? n + 1 : n), 0)
}

/** A city is "sparse" (noindex + degraded view) when its indexable count is below the floor. */
export function isCitySparse(indexableUpcoming: number): boolean {
  return indexableUpcoming < CITY_MIN_UPCOMING
}
