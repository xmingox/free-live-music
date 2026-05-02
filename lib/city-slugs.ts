// lib/city-slugs.ts

import metros from './metros.json'

export type Metro = typeof metros.metros[0]

// Map URL slugs to city codes
export const slugToCityCode: Record<string, string> = {
  'los-angeles': 'LA',
  'new-york-city': 'NYC',
  'san-francisco': 'SF',
  'chicago': 'CHI',
  'austin': 'AUS',
  'seattle': 'SEA',
  'denver': 'DEN',
  'portland': 'PDX',
  'boston': 'BOS',
  'washington-dc': 'DC',
  'dallas': 'DAL',
  'houston': 'HOU',
  'philadelphia': 'PHI',
  'atlanta': 'ATL',
  'miami': 'MIA',
  'nashville': 'NSH',
  'new-orleans': 'NOLA',
  'minneapolis': 'MIN',
  'detroit': 'DET',
  'kansas-city': 'KC',
  'st-louis': 'STL',
  'indianapolis': 'IND',
  'cleveland': 'CLE',
  'phoenix': 'PHX',
  'las-vegas': 'LV',
  'salt-lake-city': 'SLC',
  'san-diego': 'SD',
  'long-beach': 'LB',
  'memphis': 'MEM',
}

// Reverse map
export const cityCodeToSlug: Record<string, string> = Object.fromEntries(
  Object.entries(slugToCityCode).map(([slug, code]) => [code, slug])
)

// Get metro by code
export function getMetroByCode(code: string): Metro | undefined {
  return metros.metros.find(m => m.code === code) as Metro | undefined
}

// Get city code from slug
export function getCityCodeFromSlug(slug: string): string | undefined {
  return slugToCityCode[slug.toLowerCase()]
}

// Get slug from city code
export function getSlugFromCityCode(code: string): string | undefined {
  return cityCodeToSlug[code]
}

// Get all city codes
export function getAllCityCodes(): string[] {
  return Object.values(slugToCityCode)
}

// Get metro object from slug
export function getMetroFromSlug(slug: string): Metro | undefined {
  const code = getCityCodeFromSlug(slug)
  if (!code) return undefined
  return getMetroByCode(code)
}
