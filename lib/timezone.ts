const STATE_TZ: Record<string, string> = {
  // Eastern
  CT: 'America/New_York', DC: 'America/New_York', DE: 'America/New_York',
  FL: 'America/New_York', GA: 'America/New_York', IN: 'America/Indiana/Indianapolis',
  MA: 'America/New_York', MD: 'America/New_York', ME: 'America/New_York',
  MI: 'America/Detroit',  NH: 'America/New_York', NJ: 'America/New_York',
  NY: 'America/New_York', NC: 'America/New_York', OH: 'America/New_York',
  PA: 'America/New_York', RI: 'America/New_York', SC: 'America/New_York',
  VA: 'America/New_York', VT: 'America/New_York', WV: 'America/New_York',
  // Central (Nashville/Memphis are Central despite being in TN)
  AL: 'America/Chicago', AR: 'America/Chicago', IA: 'America/Chicago',
  IL: 'America/Chicago', KS: 'America/Chicago', LA: 'America/Chicago',
  MN: 'America/Chicago', MO: 'America/Chicago', MS: 'America/Chicago',
  ND: 'America/Chicago', NE: 'America/Chicago', OK: 'America/Chicago',
  SD: 'America/Chicago', TN: 'America/Chicago', TX: 'America/Chicago',
  WI: 'America/Chicago',
  // Mountain
  CO: 'America/Denver', ID: 'America/Boise', MT: 'America/Denver',
  NM: 'America/Denver', UT: 'America/Denver', WY: 'America/Denver',
  // Arizona — no DST, always UTC-7
  AZ: 'America/Phoenix',
  // Pacific
  CA: 'America/Los_Angeles', NV: 'America/Los_Angeles',
  OR: 'America/Los_Angeles', WA: 'America/Los_Angeles',
  // Non-contiguous
  AK: 'America/Anchorage', HI: 'Pacific/Honolulu',
}

export function getMetroTimezone(state: string): string {
  return STATE_TZ[state] ?? 'America/New_York'
}

// Returns YYYY-MM-DD in the given IANA timezone
export function getLocalDateStr(tz: string): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: tz })
}

// Returns 0=Sun…6=Sat for the given IANA timezone
export function getLocalDow(tz: string): number {
  const dateStr = getLocalDateStr(tz)
  // Parse as UTC noon to get the correct day of week
  return new Date(dateStr + 'T12:00:00Z').getUTCDay()
}

// Add N calendar days to a YYYY-MM-DD string, returns YYYY-MM-DD
export function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().split('T')[0]
}

// Format a YYYY-MM-DD string to a human label using UTC (date is already local)
export function formatDateLabel(
  dateStr: string,
  opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' }
): string {
  return new Date(dateStr + 'T12:00:00Z').toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' })
}
