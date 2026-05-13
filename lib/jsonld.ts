import type {
  WithContext,
  MusicEvent,
  MusicGroupLeaf,
  MusicVenueLeaf,
  BreadcrumbList,
  ItemList,
  FAQPage,
  Article,
} from 'schema-dts'

// ── Shared sub-shapes ──────────────────────────────────────────────────────────

export interface JsonLdOffer {
  price: '0'
  priceCurrency: 'USD'
  availability: 'https://schema.org/InStock'
  validFrom?: string
  url?: string
}

export interface JsonLdPostalAddress {
  streetAddress?: string
  addressLocality?: string
  addressRegion?: string
}

export interface JsonLdMusicEventItem {
  name: string
  startDate: string
  endDate?: string
  location: { name?: string; address?: string | JsonLdPostalAddress }
  offers: JsonLdOffer
  url?: string
}

// ── MusicEvent (concert detail page) ──────────────────────────────────────────

export interface MusicEventParams {
  name: string
  description: string
  url: string
  image: string
  startDate: string
  endDate?: string
  performer: string
  venueName: string
  venueCity: string
  venueState?: string
  offer: {
    validFrom: string
    url: string
  }
  organizer: {
    name: string
    url: string
  }
}

export function buildMusicEventJsonLd(p: MusicEventParams): WithContext<MusicEvent> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicEvent',
    name: p.name,
    description: p.description,
    url: p.url,
    image: p.image,
    startDate: p.startDate,
    ...(p.endDate ? { endDate: p.endDate } : {}),
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    performer: { '@type': 'MusicGroup', name: p.performer },
    location: {
      '@type': 'Place',
      name: p.venueName,
      address: {
        '@type': 'PostalAddress',
        addressLocality: p.venueCity,
        ...(p.venueState ? { addressRegion: p.venueState } : {}),
      },
    },
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
      validFrom: p.offer.validFrom,
      url: p.offer.url,
    },
    organizer: {
      '@type': 'Organization',
      name: p.organizer.name,
      url: p.organizer.url,
    },
  }
}

// ── BreadcrumbList ─────────────────────────────────────────────────────────────

export interface BreadcrumbItem {
  name: string
  item?: string
}

export function buildBreadcrumbJsonLd(items: BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((bc, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: bc.name,
      ...(bc.item ? { item: bc.item } : {}),
    })),
  }
}

// ── MusicVenue (venue detail page) ────────────────────────────────────────────

export interface MusicVenueParams {
  name: string
  url: string
  address?: {
    streetAddress: string
    addressLocality: string
    addressRegion: string
  }
  geo?: { latitude: number; longitude: number }
  events?: JsonLdMusicEventItem[]
}

export function buildMusicVenueJsonLd(p: MusicVenueParams): WithContext<MusicVenueLeaf> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicVenue',
    name: p.name,
    url: p.url,
    ...(p.address
      ? {
          address: {
            '@type': 'PostalAddress',
            streetAddress: p.address.streetAddress,
            addressLocality: p.address.addressLocality,
            addressRegion: p.address.addressRegion,
          },
        }
      : {}),
    ...(p.geo
      ? { geo: { '@type': 'GeoCoordinates', latitude: p.geo.latitude, longitude: p.geo.longitude } }
      : {}),
    ...(p.events && p.events.length > 0
      ? {
          event: p.events.map((e) => ({
            '@type': 'MusicEvent' as const,
            name: e.name,
            startDate: e.startDate,
            ...(e.endDate ? { endDate: e.endDate } : {}),
            location: {
              '@type': 'Place' as const,
              name: typeof e.location.name === 'string' ? e.location.name : undefined,
              ...(e.location.address
                ? typeof e.location.address === 'string'
                  ? { address: e.location.address }
                  : {
                      address: {
                        '@type': 'PostalAddress' as const,
                        ...(e.location.address as JsonLdPostalAddress),
                      },
                    }
                : {}),
            },
            offers: {
              '@type': 'Offer' as const,
              price: '0' as const,
              priceCurrency: 'USD',
              availability: 'https://schema.org/InStock' as const,
              ...(e.offers.url ? { url: e.offers.url } : {}),
            },
            ...(e.url ? { url: e.url } : {}),
          })),
        }
      : {}),
  }
}

// ── MusicGroup (artist page) ───────────────────────────────────────────────────

export interface MusicGroupParams {
  name: string
  url: string
  events: JsonLdMusicEventItem[]
}

export function buildMusicGroupJsonLd(p: MusicGroupParams): WithContext<MusicGroupLeaf> {
  return {
    '@context': 'https://schema.org',
    '@type': 'MusicGroup',
    name: p.name,
    url: p.url,
    event: p.events.map((e) => ({
      '@type': 'MusicEvent' as const,
      name: e.name,
      startDate: e.startDate,
      location: {
        '@type': 'Place' as const,
        name: typeof e.location.name === 'string' ? e.location.name : undefined,
        ...(e.location.address
          ? typeof e.location.address === 'string'
            ? { address: e.location.address }
            : {
                address: {
                  '@type': 'PostalAddress' as const,
                  ...(e.location.address as JsonLdPostalAddress),
                },
              }
          : {}),
      },
      offers: {
        '@type': 'Offer' as const,
        price: '0' as const,
        priceCurrency: 'USD',
        availability: 'https://schema.org/InStock' as const,
      },
      ...(e.url ? { url: e.url } : {}),
    })),
  }
}

// ── ItemList (city concerts page, state hub) ───────────────────────────────────

export type ItemListItem =
  | { type: 'MusicEvent'; position: number; event: JsonLdMusicEventItem }
  | { type: 'City'; position: number; name: string; url: string }

export interface ItemListParams {
  name: string
  description?: string
  url?: string
  numberOfItems?: number
  items: ItemListItem[]
}

export function buildItemListJsonLd(p: ItemListParams): WithContext<ItemList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: p.name,
    ...(p.description ? { description: p.description } : {}),
    ...(p.url ? { url: p.url } : {}),
    ...(p.numberOfItems !== undefined ? { numberOfItems: p.numberOfItems } : {}),
    itemListElement: p.items.map((item) => {
      if (item.type === 'City') {
        return {
          '@type': 'ListItem' as const,
          position: item.position,
          item: { '@type': 'City' as const, name: item.name, url: item.url },
        }
      }
      const e = item.event
      return {
        '@type': 'ListItem' as const,
        position: item.position,
        item: {
          '@type': 'MusicEvent' as const,
          name: e.name,
          startDate: e.startDate,
          location: {
            '@type': 'Place' as const,
            name: typeof e.location.name === 'string' ? e.location.name : undefined,
            ...(e.location.address
              ? typeof e.location.address === 'string'
                ? { address: e.location.address }
                : {
                    address: {
                      '@type': 'PostalAddress' as const,
                      ...(e.location.address as JsonLdPostalAddress),
                    },
                  }
              : {}),
          },
          offers: {
            '@type': 'Offer' as const,
            price: '0' as const,
            priceCurrency: 'USD',
            availability: 'https://schema.org/InStock' as const,
          },
        },
      }
    }),
  }
}

// ── FAQPage (city concerts page) ──────────────────────────────────────────────

export interface FaqItem {
  question: string
  answer: string
}

export function buildFaqPageJsonLd(items: FaqItem[]): WithContext<FAQPage> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  }
}

// ── Article (city guide pages) ─────────────────────────────────────────────────

export interface ArticleParams {
  headline: string
  description: string
  url: string
  datePublished?: string
}

export function buildArticleJsonLd(p: ArticleParams): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: p.headline,
    description: p.description,
    url: p.url,
    ...(p.datePublished ? { datePublished: p.datePublished } : {}),
    publisher: {
      '@type': 'Organization',
      name: 'Free Live Music',
      url: 'https://www.freelivemusic.co',
    },
    author: {
      '@type': 'Organization',
      name: 'Free Live Music',
    },
  }
}
