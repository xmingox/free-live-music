// lib/city-slugs.ts

import metros from './metros.json'

export type Metro = typeof metros.metros[0]

// Generate slug from city name (convert to kebab-case)
function cityToSlug(cityName: string): string {
  return cityName
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // spaces to hyphens
    .replace(/[^\w-]/g, '') // remove special chars
    .replace(/-+/g, '-') // collapse multiple hyphens
    .replace(/^-|-$/g, '') // trim hyphens from edges
}

// Build slug → code mapping automatically from metros.json
export const slugToCityCode: Record<string, string> = Object.fromEntries(
  metros.metros.map(m => [cityToSlug(m.city), m.code])
)

// Reverse map: code → slug
export const cityCodeToSlug: Record<string, string> = Object.fromEntries(
  metros.metros.map(m => [m.code, cityToSlug(m.city)])
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

// Get all city codes (in order from metros.json)
export function getAllCityCodes(): string[] {
  return metros.metros.map(m => m.code)
}

// Get all metros (useful for sitemap generation)
export function getAllMetros(): Metro[] {
  return metros.metros as Metro[]
}

// Get metro object from slug
export function getMetroFromSlug(slug: string): Metro | undefined {
  const code = getCityCodeFromSlug(slug)
  if (!code) return undefined
  return getMetroByCode(code)
}

// Get top N metros by some criteria (e.g., for homepage nav)
export function getTopMetros(count: number = 10): Metro[] {
  // Return metros in order (assumes metros.json is ordered by importance)
  return metros.metros.slice(0, count) as Metro[]
}
