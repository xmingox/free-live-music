// Awin publisher ID — set BOOKING_AFFILIATE_ID in Vercel env vars
// Booking.com merchant ID on Awin North America: 6776
const AWIN_BOOKING_MERCHANT_ID = '6776'

export function outboundUrl(to: string | null | undefined, src: string): string {
  if (!to) return '#'
  return `/api/go?src=${encodeURIComponent(src)}&to=${encodeURIComponent(to)}`
}

// Wrap a Booking.com URL in an Awin tracking link when publisher ID is set.
// Falls back to the plain booking.com URL without an affiliate ID.
export function wrapWithAwin(bookingUrl: string): string {
  const publisherId = process.env.BOOKING_AFFILIATE_ID
  if (!publisherId) return bookingUrl
  const params = new URLSearchParams({
    awinmid: AWIN_BOOKING_MERCHANT_ID,
    awinpublid: publisherId,
    clickref: '',
    p: bookingUrl,
  })
  return `https://www.awin1.com/cread.php?${params.toString()}`
}

// Booking.com city search for a given concert date — hotel affiliate
// Requires BOOKING_AFFILIATE_ID (Awin publisher ID) in Vercel env vars to earn commissions
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

  const bookingUrl = `https://www.booking.com/searchresults.html?${params.toString()}`
  return wrapWithAwin(bookingUrl)
}
