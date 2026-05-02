/**
 * Extract event metadata from a URL
 * Attempts to scrape and parse event details from the submitted link
 */

interface ExtractedEvent {
  artist: string | null
  venue: string | null
  date: string | null // YYYY-MM-DD
  time: string | null
  imageUrl: string | null
  description: string | null
}

/**
 * Fetch and parse HTML from a URL to extract event details
 */
export async function extractEventDetails(url: string): Promise<ExtractedEvent> {
  const result: ExtractedEvent = {
    artist: null,
    venue: null,
    date: null,
    time: null,
    imageUrl: null,
    description: null,
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 5000,
    })

    if (!response.ok) return result

    const html = await response.text()

    // Try to extract from Open Graph meta tags (most reliable)
    result.artist = extractMetaTag(html, 'og:title')
    result.venue = extractMetaTag(html, 'og:description')
    result.imageUrl = extractMetaTag(html, 'og:image')

    // Try to extract date from common event platforms
    // Look for patterns like "May 28, 2026" or "2026-05-28"
    result.date = extractDate(html)
    result.time = extractTime(html)

    // Fallback: if no date found, try structured data (JSON-LD, microdata)
    if (!result.date) {
      const structuredData = extractStructuredData(html)
      if (structuredData) {
        result.artist = result.artist || structuredData.name
        result.venue = result.venue || structuredData.location
        result.date = result.date || structuredData.date
        result.time = result.time || structuredData.time
        result.imageUrl = result.imageUrl || structuredData.image
      }
    }

    return result
  } catch (error) {
    console.error(`Failed to extract event details from ${url}:`, error)
    return result
  }
}

/**
 * Extract meta tag content from HTML
 */
function extractMetaTag(html: string, property: string): string | null {
  // Look for both property= and name= variants
  const patterns = [
    new RegExp(`<meta\\s+property=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+name=["']${property}["']\\s+content=["']([^"']+)["']`, 'i'),
    new RegExp(`<meta\\s+content=["']([^"']+)["']\\s+property=["']${property}["']`, 'i'),
  ]

  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match) return match[1]
  }

  return null
}

/**
 * Extract date from HTML (looks for common date patterns)
 */
function extractDate(html: string): string | null {
  // Pattern for dates like "May 28, 2026" or "May 28"
  const monthPattern = /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{1,2})(?:\s*,?\s*(20\d{2}))?/gi

  let match
  while ((match = monthPattern.exec(html)) !== null) {
    const monthStr = match[1]
    const day = match[2]
    const year = match[3] || new Date().getFullYear()

    // Parse the date
    const months: Record<string, number> = {
      january: 0, february: 1, march: 2, april: 3, may: 4, june: 5,
      july: 6, august: 7, september: 8, october: 9, november: 10, december: 11,
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
    }

    const monthIndex = months[monthStr.toLowerCase()]
    if (monthIndex !== undefined) {
      const date = new Date(parseInt(year), monthIndex, parseInt(day))
      // Only accept future dates or recent past dates (within 30 days)
      const now = new Date()
      const daysDiff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      if (daysDiff > -30 && daysDiff < 365) {
        return date.toISOString().split('T')[0] // YYYY-MM-DD
      }
    }
  }

  // Also try ISO format: 2026-05-28
  const isoMatch = html.match(/(\d{4})-(\d{2})-(\d{2})/)
  if (isoMatch) {
    const year = isoMatch[1]
    const month = isoMatch[2]
    const day = isoMatch[3]
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
    const now = new Date()
    const daysDiff = (date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > -30 && daysDiff < 365) {
      return `${year}-${month}-${day}`
    }
  }

  return null
}

/**
 * Extract time from HTML (looks for patterns like "7:00 PM", "19:00", "7pm", etc.)
 */
function extractTime(html: string): string | null {
  // Pattern for times like "7:00 PM", "19:00", "7pm", etc.
  const timePattern = /(\d{1,2}):?(\d{2})?\s*(AM|PM|am|pm)?/g

  const match = timePattern.exec(html)
  if (match) {
    const hours = match[1]
    const minutes = match[2] || '00'
    const period = match[3] ? ` ${match[3].toUpperCase()}` : ''
    return `${hours}:${minutes}${period}`
  }

  return null
}

/**
 * Extract structured data (JSON-LD or microdata) from HTML
 */
function extractStructuredData(html: string): Partial<ExtractedEvent> | null {
  try {
    // Look for JSON-LD event schema
    const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>(.*?)<\/script>/is)
    if (jsonLdMatch) {
      const jsonStr = jsonLdMatch[1]
      const json = JSON.parse(jsonStr)

      // Handle both single event and array
      const event = json['@type'] === 'Event' ? json : (Array.isArray(json) ? json.find((j: any) => j['@type'] === 'Event') : null)

      if (event) {
        return {
          artist: event.name,
          venue: event.location?.name || event.location,
          date: event.startDate ? event.startDate.split('T')[0] : null,
          time: event.startDate ? event.startDate.split('T')[1]?.substring(0, 5) : null,
          imageUrl: event.image,
          description: event.description,
        }
      }
    }
  } catch (error) {
    console.error('Error parsing JSON-LD:', error)
  }

  return null
}
