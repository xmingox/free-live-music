export function outboundUrl(to: string | null | undefined, src: string): string {
  if (!to) return '#'
  return `/api/go?src=${encodeURIComponent(src)}&to=${encodeURIComponent(to)}`
}

// Booking.com city search for a given concert date — hotel affiliate
// Requires BOOKING_AFFILIATE_ID env var to earn commissions; works without it too
export function bookingSearchUrl(city: string, state: string, date: string): string {
  const checkin = date // YYYY-MM-DD
  const checkoutDate = new Date(date + 'T00:00:00')
  checkoutDate.setDate(checkoutDate.getDate() + 1)
  const checkout = checkoutDate.toISOString().split('T')[0]

  const params = new URLSearchParams({
    ss: `${city}, ${state}`,
    checkin,
    checkout,
    group_adults: '2',
    no_rooms: '1',
  })

  // Client-side affiliate ID injection — /api/go handles server-side for Booking.com links,
  // but for freshly generated URLs we add it directly
  const aid = process.env.BOOKING_AFFILIATE_ID
  if (aid) params.set('aid', aid)

  return `https://www.booking.com/searchresults.html?${params.toString()}`
}
