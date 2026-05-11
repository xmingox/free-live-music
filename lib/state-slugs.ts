import metros from './metros.json'

export const STATE_NAMES: Record<string, string> = {
  AK: 'Alaska', AL: 'Alabama', AR: 'Arkansas', AZ: 'Arizona',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut',
  DC: 'Washington DC', DE: 'Delaware', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', IA: 'Iowa', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana',
  KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', MA: 'Massachusetts',
  MD: 'Maryland', ME: 'Maine', MI: 'Michigan', MN: 'Minnesota',
  MO: 'Missouri', MS: 'Mississippi', MT: 'Montana', NC: 'North Carolina',
  ND: 'North Dakota', NE: 'Nebraska', NH: 'New Hampshire', NJ: 'New Jersey',
  NM: 'New Mexico', NV: 'Nevada', NY: 'New York', OH: 'Ohio',
  OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas',
  UT: 'Utah', VA: 'Virginia', VT: 'Vermont', WA: 'Washington',
  WI: 'Wisconsin', WV: 'West Virginia', WY: 'Wyoming',
}

function nameToSlug(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

// slug → state code
export const slugToStateCode: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [nameToSlug(name), code])
)

// state code → slug
export const stateCodeToSlug: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_NAMES).map(([code, name]) => [code, nameToSlug(name)])
)

// All states that have at least one metro in metros.json
export function getActiveStateSlugs(): string[] {
  const codes = new Set(metros.metros.map((m) => m.state))
  return [...codes].map((code) => stateCodeToSlug[code]).filter(Boolean)
}

// All metros for a given state code, sorted alphabetically by city name
export function getMetrosByState(stateCode: string) {
  return metros.metros
    .filter((m) => m.state === stateCode)
    .sort((a, b) => a.city.localeCompare(b.city))
}
