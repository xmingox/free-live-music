import type { Metro } from './city-slugs'
import { getAllMetros } from './city-slugs'

export function isMetroPublished(metro: Metro): boolean {
  // All US metros are considered published
  if (!metro.country || metro.country === 'US') return true
  // International metros require explicit published flag or preview env var
  if ((metro as Record<string, unknown>).published === true) return true
  if (process.env.INTL_PREVIEW === '1') return true
  return false
}

export function getPublishedMetros(): Metro[] {
  return getAllMetros().filter(isMetroPublished)
}
