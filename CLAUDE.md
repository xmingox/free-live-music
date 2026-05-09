# freelivemusic.co — Project Context for Claude Code
> Last updated: May 5, 2026

## What This Is
A web app that helps people find free live music events near them across the US. Aggregates data from Eventbrite (via Apify scraping), parks & rec calendars, and user submissions. Starting with LA/NYC, expanding to 75+ US cities.

- **Live site:** https://www.freelivemusic.co
- **GitHub:** https://github.com/xmingox/free-live-music
- **Active branch:** main (Vercel auto-deploys on push)
- **Status:** Live & functional as of May 5, 2026

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15.3.1 / React (TypeScript, PWA-ready) |
| Styling | Tailwind CSS — dark theme (slate-800/900 base) |
| Maps | Mapbox GL JS |
| Hosting | Vercel — project: **free-live-music-1lwp** |
| Database | Supabase (PostgreSQL) |
| Data pipeline | Apify → CSV → csv_to_sql.py → Supabase SQL editor |

---

## Credentials & Services

**Supabase**
- URL: `NEXT_PUBLIC_SUPABASE_URL` (see `.env.local`)
- Anon key: `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local`)
- Service role: `SUPABASE_SERVICE_ROLE_KEY` (see `.env.local`)

**Vercel**
- Active project: `free-live-music-1lwp` ← THIS is the live one
- Dead project: `free-live-music` ← old/disconnected, ignore
- Domain `www.freelivemusic.co` is assigned to `free-live-music-1lwp`

**Apify scraper:** `crawlerbros/eventbrite-events-scraper` (~$0.001/result)

---

## Database Schema

```sql
concerts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  display_id      text,
  slug            text,
  artist_name     text,
  venue           text,
  date            date,
  time            time,
  neighborhood    text,
  city            text,
  genre           text,
  price           text,
  admission_type  text,
  indoor_outdoor  text,
  image_url       text,
  is_verified     boolean DEFAULT false,
  source_url      text,
  source_name     text,
  source_id       text,
  created_at      timestamptz
)
```

Current data: 829 verified events, all with slugs populated.

---

## Key Files

- `app/concerts-client.tsx` — home page client component; reads URL params via `useEffect(window.location.search)` (NOT useSearchParams — avoids Suspense boundary that caused LCP 5.3s)
- `app/concerts/[city]/page.tsx` — metro city SSR page
- `app/concerts/city/[alias]/page.tsx` — alias city SSR page
- `app/venues/[city]/page.tsx` — city venue list with type/neighborhood discovery hub links
- `app/venues/[city]/venue-list-client.tsx` — client search/filter for venue list
- `app/venues/[city]/[slug]/page.tsx` — individual venue detail page
- `app/venues/[city]/type-hub-page.tsx` — shared server component for venue type hubs; imported by each type wrapper
- `app/venues/[city]/bars/page.tsx` — "Free Music Bars in {City}" (+ breweries, parks, restaurants, amphitheaters)
- `app/venues/[city]/neighborhood/[hood]/page.tsx` — neighborhood hub pages; on-demand, no generateStaticParams
- `components/SiteNav.tsx` — site-wide nav (Concerts | Venues links + breadcrumb); used on all venue and concert detail pages
- `lib/metros.json` — metro definitions with city codes and aliases
- `lib/data.ts` — Supabase query helpers, alias-aware
- `lib/city-slugs.ts` — slug helpers including `cityToSlug()` for URL generation

---

## Metro / City System

177 US metros in `lib/metros.json`. `getConcerts(metroCode)` expands to `[metro.city, ...metro.aliases]` and queries with `.in('city', cities)`.

Recent alias fixes (May 5, 2026) — all resolved:
NYC, LA, NSH, CHI, ATL, AUS, DAL, BOS, DEN, DC, PDX, SEA, SF, MEM, FTW

---

## Open Bugs / Current Tasks

### 🔴 Deduplication bug (active)
Events render multiple times on homepage grid even though they exist once in Supabase. Check `concerts-client.tsx` for array concatenation bug in `useEffect` / `useMemo`.

### 🟡 Sitemap missing concert pages
`/concert/[slug]` pages not in sitemap.xml. Need to add all 829 slugs from Supabase at priority 0.6.

### 🟡 Time display
Events show `19:00:00` raw format instead of `7:00 PM`.

### 🟡 Venue shows "TBD"
Consider hiding venue line when value is TBD.

---

## Data Pipeline

1. Run `crawlerbros/eventbrite-events-scraper` on Apify
2. Export CSV → run `python csv_to_sql.py`
3. Paste SQL into Supabase SQL Editor
4. Run: `UPDATE concerts SET is_verified = true WHERE source_name = 'Eventbrite' AND date != '2026-01-01'`
5. Delete placeholders: `DELETE FROM concerts WHERE date = '2026-01-01'`

---

## Deployment

Git push to `main` → Vercel auto-deploys to `free-live-music-1lwp` → live at `www.freelivemusic.co`
⚠️ Ignore old dead project `free-live-music` — domain moved away from it on May 5, 2026.

---

## Roadmap

Done ✅: DB setup, Eventbrite import (829 events), Next.js 15.3.1, metro alias fixes, alias city pages, ISR, domain fix, LCP fix (5.3s → <3s), venue discovery (6,300+ venues across 108 cities), venue UX Phase 1 + 2 (type hubs, neighborhood hubs, site nav, nearby venues)

In Progress 🔄: Deduplication bug, sitemap concert pages, SEO architecture

Planned ⏳: Search Console submission, genre/date filtering, event page improvements, user submissions, push notifications, venue map view (/venues/[city]/map), footer nav with city list, more data sources (LA Parks, Hollywood Bowl, Grand Performances, KCRW)

---

#### Critical Requirements:
- **time:** Must be 12-hour format (7:30pm, 10:00am) — NOT 19:30 or 19:30:00
- **date:** Must be >= today (frontend filters past events)
- **price:** Always "Free"
- **city:** Must match frontend city codes exactly
- **is_verified:** true for manually added events

## Data Pipeline

### Adding Free Concert Data (6 Steps)

1. **Research:** WebSearch for `"[CITY] free concert 2026"`
2. **Identify Series:** Find recurring concerts with specific dates
3. **Extract Data:** Get artist_name, venue, date, time, genre
4. **Normalize:** Fix time format (→ 7:30pm), date format (→ YYYY-MM-DD)
5. **SQL INSERT:** Add to concerts table
6. **Redeploy:** Click "Redeploy" on Vercel to clear ISR cache

### Verification Query
```sql
SELECT city, COUNT(*) as total_events, COUNT(DISTINCT artist_name) as unique_series
FROM concerts WHERE city = 'FTW' GROUP BY city;
```

## Known Issues & Solutions

### Issue: Events not showing after database insert
**Cause:** ISR cache (1-hour TTL on city pages)
**Solution:** Redeploy on Vercel dashboard to clear cache immediately

### Issue: Events in database but not on frontend
Check:
- Time format: Must be "7:30pm" (not "19:30")
- Date: Must be future date
- City code: Must match exactly (FTW, not FORT WORTH)
- is_verified: Should be true

Debug with:
```sql
SELECT * FROM concerts WHERE city = 'FTW' LIMIT 5;
SELECT DISTINCT time FROM concerts WHERE city = 'FTW';
```

## City Codes Reference

FTW=Fort Worth, LOU=Louisville, ELP=El Paso, BHM=Birmingham, ABQ=Albuquerque, TUS=Tucson, TLS=Tulsa, PIT=Pittsburgh, RAH=Raleigh, OKC=Oklahoma City, SAT=San Antonio, HNL=Honolulu, CHR=Charlotte

## Setup on New Machine

```bash
git clone https://github.com/xmingox/free-live-music.git
cd free-live-music
npm install
vercel link
vercel env pull .env.local
npm run dev
```

## Common Tasks

### Add events for a new city
1. WebSearch: "[CITY] free concert 2026"
2. Find 3-5 series with dates
3. Extract artist_name, venue, date, time
4. Normalize times (→ 7:30pm format)
5. INSERT into concerts
6. Verify with GROUP BY query
7. Redeploy on Vercel

### View zero-event cities
```sql
SELECT city FROM city_year_sequences 
WHERE city NOT IN (SELECT DISTINCT city FROM concerts);
```

## Recent Work (May 2026)

Added 125 events across 10 zero-event cities: Fort Worth (16), Louisville (14), El Paso (17), Birmingham (11), Albuquerque (10), Tucson (8), Tulsa (11), Pittsburgh (12), Raleigh (12), Oklahoma City (14).

Fixed: City code standardization (FTW, LOU, etc.) and time format normalization (12-hour format).

---
Last Updated: May 6, 2026

## Deployment Workflow

### Code Changes
```bash
git add .
git commit -m "Your message"
git push origin main
# Vercel auto-deploys after push
```

### Data Changes (Database)
```bash
1. Go to https://vercel.com/dashboard
2. Find free-live-music project
3. Click "Redeploy" button
4. Wait ~30-60 seconds
5. Refresh site in new private window
```

## Notes for Claude Code & Cowork

This CLAUDE.md file is auto-loaded in future sessions to provide:
- Project context and architecture
- Database schema reference
- Data pipeline steps
- Common debugging queries
- Setup instructions for new machines
- Known issues and solutions

**Next session:** Just ask about adding events, debugging issues, or improving the site—I'll have full context!

## Recent Work (May 2026)

**Completed:**
- Added 125 free concert listings across 10 major zero-event cities
- Standardized city codes (FTW, LOU, ELP, BHM, ABQ, TUS, TLS, PIT, RAH, OKC)
- Normalized all time formats to 12-hour (7:30pm format)
- Verified all events have is_verified=true and future dates

**Cities Added:**
- Fort Worth: 16 events
- Louisville: 14 events
- El Paso: 17 events
- Birmingham: 11 events
- Albuquerque: 10 events
- Tucson: 8 events
- Tulsa: 11 events
- Pittsburgh: 12 events
- Raleigh: 12 events
- Oklahoma City: 14 events

**Fixed:**
- City code standardization (full names → 3-letter codes)
- Time format conversion (24-hour → 12-hour with am/pm)
- ISR cache clear procedure (via Vercel redeploy)

---

Last Updated: May 6, 2026
Maintained By: xmingox
Current Status: Ready for production with 125+ events across 10 cities

---

## Session Summary — May 7, 2026

### Fixes Applied

1. **SEO improvements** (`app/page.tsx`, `app/concert/[slug]/page.tsx`, `next.config.ts`)
   - Replaced `force-dynamic` with `revalidate = 3600` (ISR) on home and concert pages
   - Added `BreadcrumbList` JSON-LD + visible `<nav>` breadcrumb to concert pages
   - Added canonical URLs and OpenGraph/Twitter metadata to home and concert pages
   - `next.config.ts`: disabled `X-Powered-By`, enforced `trailingSlash: false`, added `X-Robots-Tag: index, follow`

2. **New cities added to metros.json** (`lib/metros.json`)
   - Added ELP (El Paso, TX) and HNL (Honolulu, HI)
   - Added 3-letter code as alias for all new cities (FTW, LOU, ELP, BHM, PIT, OKC, SAT, HNL) so events stored with those codes are matched by the frontend filter
   - Fixed 5 mismatched codes via aliases: ABQ→ALB, TUS→TUC, TLS→TUL, RAH→RDU, CHR→CHA

3. **City type updated** (`types/index.ts`)
   - Added all 13 new city codes to the `Concert.city` and `City` type unions

4. **Supabase 1000-row cap fixed** (`lib/data.ts`)
   - Added `.limit(5000)` to `getConcerts()` — default Supabase cap of 1000 was cutting off newer cities
   - Root cause: 1,684 future verified events exist; FTW/LOU/etc. events were beyond the first 1000

### How to Verify
- City page (direct query, no ISR issue): `https://www.freelivemusic.co/concerts/fort-worth`
- Home page (ISR cached, refreshes hourly): `https://www.freelivemusic.co/?city=FTW&date=all`
- SQL check: `SELECT city, COUNT(*) FROM concerts WHERE date >= CURRENT_DATE GROUP BY city ORDER BY count DESC;`

### Lesson Learned
When adding new cities, always check:
- [ ] Metro entry exists in `lib/metros.json`
- [ ] 3-letter code is in the `aliases` array (not just the `code` field)
- [ ] City code is in the `City` type in `types/index.ts`
- [ ] Events are stored with a code that matches an alias or `metro.city`

---

## Session Summary — May 7, 2026 (Part 2)

### St. Louis (STL) Events Added
Inserted 30 verified events across 6 series:
- **Whitaker Music Festival** — Missouri Botanical Garden, Wednesdays May 27–Jul 29, 7:00pm (10 events)
- **Mondays at the Music Stand** — Tower Grove Park, Jul 14–Sep 22, 6:00pm (6 events)
- **Gateway Festival Orchestra** — Jun 18, Jul 12, 19, 26 (4 events)
- **Blues at the Arch** — Gateway Arch National Park, Aug 14–16, 12:00pm (3 events)
- **St. Louis Symphony Orchestra** — Art Hill Forest Park, Sep 16, 7:00pm (1 event)
- **Making Music Concert Series** — Kirkwood Park, Jun 14–Aug 23, 7:30pm (6 events)

### Bugs Fixed

#### 1. NaN time display on concert detail pages
**File:** `app/concert/[slug]/page.tsx`
**Cause:** `formatTime()` split `"5:30pm"` on `:` and called `Number("30pm")` → NaN. Affected every concert detail page since all times are stored in 12-hour format.
**Fix:** If time string already contains `am` or `pm`, return it directly. Only run 24-hour conversion as fallback.
**Lesson:** The DB stores time in 12-hour format (`7:30pm`). Don't try to re-parse it — display as-is.

#### 2. STL events not showing on frontend
**Cause:** `metros.json` had empty `aliases: []` for STL, so client-side filter `cityNames.includes(c.city)` never matched events stored as `city = 'STL'`.
**Fix:** Added `"STL"` to aliases array in metros.json.
**Lesson:** Every time a new city is added, its 3-letter code must be in the `aliases` array — not just the `code` field.

### Checklist for Adding New Cities (Updated)
- [ ] Metro entry exists in `lib/metros.json`
- [ ] 3-letter code is in the `aliases` array
- [ ] City code is in the `City` type in `types/index.ts`
- [ ] Events stored with code matching an alias or `metro.city`
- [ ] Verify on `/concerts/{city-slug}` page (direct DB query, no ISR issue)

---

## Session Summary — May 7, 2026

### Baltimore (BAL) — 15 events inserted
**Sources:** All confirmed from official 2026 venue/org sites (no year-adjusted guessing)
- **Artscape** (2) — 100 Holliday St, Downtown — May 23–24, 11:00am — source: artscape.org
- **Patterson Park Summer Concert Series** (5) — Below the Observatory — Jun 7–Aug 9, 6:00pm — source: pattersonpark.com
- **WTMD First Thursday** (4) — Canton Waterfront Park — Jun 4–Sep 3, 5:30pm — source: wtmd.org
- **Summer Sounds at Belvedere Square** (4) — Belvedere Square Market — Jun 19–Sep 18, 6:00pm — source: belvederesquare.com

**Code changes:** Added `BAL` to metros.json aliases and to City type in types/index.ts. Also added missing `STL` to City type.

### St. Louis (STL) — 17 events inserted (replaced 30 unverified events)
**Why replaced:** Previous 30 events were sourced from a May 2025 STL Mag article; dates were adjusted to 2026 equivalents but unverified. At least "Mondays at the Music Stand" had confirmed wrong dates (Jul 14, 2026 = Tuesday, not Monday).

**New sources:** All confirmed directly from 2026 venue/org sites
- **Whitaker Music Festival** (10) — Cohen Amphitheater, Missouri Botanical Garden, Tower Grove — Wednesdays May 27–Jul 29, 7:00pm — source: missouribotanicalgarden.org (full lineup with named artists)
- **Blues at the Arch** (3) — Gateway Arch National Park, Downtown — Aug 14–16, time TBA — source: archpark.org
- **Gateway Festival Orchestra** (4) — multiple venues (Ritenour HS, WashU Brookings Quad, 560 Music Center) — Jun 18–Jul 26 — source: gatewayfestivalorchestra.org

**Lesson:** Always source event dates from the venue's own 2026 page, not from a "best of summer" article that may be from the prior year.

### Jacksonville (JAX) — 17 events inserted
- **Jacksonville Jazz Festival** (3) — Ford on Bay, Downtown — May 22–24 — source: jacksonvillejazzfest.com (headliners: Parliament Funkadelic, Andra Day, Nile Rodgers & CHIC)
- **Riverside Arts Market** (12) — 715 Riverside Ave, Riverside — Saturdays 10:00am, May–Aug — source: visitjacksonville.com
- **Florida Fin Fest** (2) — Seawalk Pavilion, Jacksonville Beach — Sep 11–12 — source: flfinfest.com

### Omaha (OMA) — 29 events inserted
9 series: RITMO Music Fest, Orchestra Omaha Outdoor Pops, Rock The C!, Beats & Bites Stage (6), Music in Dundee (5), Omaha Freedom Festival, Music at Miller Park (2 named performers), Nebraska Wind Symphony, 4th of July Beach Party, Live on the Lawn (2), Jazz on the Green (4), Playing with Fire (3), Summer Sounds at Highlander

### Birmingham (BHM) — 27 events total (16 new Pepper Place + 11 existing fixed)
**Data fixes applied to existing 11 events:** corrected slugs to standard format (artist-bhm-YYYY-MM-DD), fixed Magic City Pop-Up Plaza venue to "Railroad Park, 17th Street Plaza", fixed ASO neighborhood from "Railroad Park" to "Southside", added source_url to all events.
- **Pepper Place Saturday Market** (16) — The Market at Pepper Place, Southside — Saturdays 7:00am, May–Aug — source: pepperplacemarket.com
- **Lesson:** Always audit existing city events before adding new ones — slug format, venue, neighborhood, and source_url all need to match the standard.
- [ ] Check concert detail pages for NaN in time display

### San Diego (SD) — 72 events inserted
4 series, all from official venue/city sources:
- **Twilight in the Park** (33) — Balboa Park, Balboa Park neighborhood — Tue/Wed/Thu Jun 16–Aug 27, time not listed on official site (stored as NULL) — source: balboapark.org/twilight-concerts (full named-performer schedule)
- **Coronado Promenade Concerts** (17) — Spreckels Park, Coronado — Sundays May 24–Sep 6, 6:00pm (May 24 first act 4:30pm, Aug 23 first act 4:30pm) — source: coronadoconcert.com
- **Santee Summer Concerts** (9) — Town Center Community Park East, Santee — Thursdays Jun 11–Aug 13 (no Jul 2), 6:30pm — source: cityofsanteeca.gov
- **Music on Main** (13) — Prescott Promenade, El Cajon — Fridays Jun 5–Aug 28, 6:00pm — source: downtownelcajon.com

**Code changes:** Added `SD` to metros.json aliases and to City type in types/index.ts.
**Twilight conflict resolved:** Sources initially disagreed on Tue/Wed/Fri vs Tue/Wed/Thu — confirmed Tue/Wed/Thu from official balboapark.org schedule.

### Santa Barbara (SBA) — 4 placeholder events inserted
- **Concerts in the Park** (4) — Alameda Park, Downtown — Sundays Jun 7, Jun 21, Jul 12, Aug 2 — source: santabarbaraca.gov
- **Note:** Performers not announced until June 2026. Used series name as artist_name. Come back in June to update with actual performers.
**Code changes:** Added `SBA` to metros.json aliases and to City type in types/index.ts.

### Orange County / Anaheim (ANA) — 73 events inserted (two passes)
**First pass (43 events):**
- **Twilight Concert Series** (13) — Irvine Great Park Amphitheater — Fri/Sat Jun 27–Aug 29, 7:00pm — source: cityofirvine.org
- **Concerts in the Park** (9) — Bill Barber Park, Irvine — Thursdays Jul 9–Sep 4 (no Aug 6), 7:00pm — source: cityofirvine.org
- **Summer Concert Series** (4) — Huntington Central Park, HB — Sundays 5:00pm — source: surfcityusa.com
- **Concerts in the Park** (5) — Fullerton — Thursdays Jun 5–Jul 3, 6:30pm — source: fullertonca.gov
- **Summer Concert Series** (5) — Yorba Linda — Thursdays Jun 5–Jul 3, 7:00pm — source: yorbalindaca.gov
- **Concerts in the Park** (7) — Mile Square Regional Park, Fountain Valley — Saturdays Jun 7–Jul 19, 7:00pm — source: fountainvalleyca.gov

**Second pass (30 events):**
- **Summer Concerts** (7) — Cypress Civic Center, Cypress — Fridays Jun 6–Jul 18, 6:00pm — source: cypressca.gov
- **Concerts in the Park** (5) — City Hall Park, Brea — Wednesdays Jun 4–Jul 2, 6:30pm — source: cityofbrea.net
- **Summer Concert Series** (6) — Boisseranc Park, Buena Park — Wednesdays Jun 4–Jul 9, 7:00pm — source: buenapark.com
- **Concerts at the Park** (5) — Hart Park Bandshell, Orange — Wednesdays Jun 4–Jul 2, 6:30pm — source: cityoforange.org
- **Concerts in the Park** (4) — Grand Park, Aliso Viejo — Sundays Jun 7–Jun 28, time TBD — source: cityofalisoviejoca.gov
- **Concerts in the Park** (3) — Crown Valley Community Park, Laguna Niguel — Fridays May 15, Jul 10, Jul 24, time TBD — source: lagunaniguelhca.org

**Code changes:** Added `ANA` to metros.json aliases and to City type in types/index.ts.
**Pagination fix:** Rewrote getConcerts() in lib/data.ts to paginate using .range() (1000 rows/page) — fixes Supabase server-side max_rows cap that was silently truncating results for all cities.
**Skipped:** La Mesa Sundays at Six (2026 performers not yet announced), Sonidos del Barrio (2026 dates not yet announced).

---

## Session Summary — May 8, 2026

### LCP Fix (5.3s → <3s)
**Root cause:** `useSearchParams()` in `concerts-client.tsx` forced the component into a Suspense boundary. Server sent empty HTML; the skeleton showed at FCP (2.9s), and the real content swapped in at LCP (5.3s) — a 2.4s gap caused entirely by a Suspense swap, not image loading.
**Fix:** Removed `useSearchParams` entirely. State now initializes from `defaultCity` prop (SSR-safe). A one-time `useEffect` reads `window.location.search` after hydration. Full page content renders on the server — no Suspense, no empty HTML.
**Lesson:** Never use `useSearchParams()` in a component that should SSR. Use `useEffect` + `window.location.search` for one-time URL param reads instead.

### Venue Discovery Pipeline
Ran `scripts/discover-venues.mjs` across 72 cities using Google Places API. Inserted ~6,300 venues total across 108 metro areas. Data includes: name, address, neighborhood, lat/lng, venue_type, google_place_id, website, music_schedule.
**Dead URL cleanup:** Identified and NULLed websites for 3 venues with Amazon affiliate links inserted by Google Places. DNS-failing venues (closed businesses) left as-is — website field conveys useful historical info.

### Venue UX — Phase 1 (completed)
1. `components/SiteNav.tsx` — site-wide nav with breadcrumbs + Concerts/Venues links, used on all venue and concert detail pages
2. `concerts-client.tsx` — added slim top nav bar and "Browse {City} venues →" link in hero
3. `app/concert/[slug]/page.tsx` — venue name links to venue detail page when venue_id is set
4. `app/venues/[city]/venue-list-client.tsx` — search input, type filter chips, "With upcoming shows" toggle
5. `app/venues/[city]/[slug]/page.tsx` — nearby venues section, music_schedule-aware empty state, Claim CTA

### Venue UX — Phase 2 (completed)
#### Venue type hub pages
`app/venues/[city]/type-hub-page.tsx` — shared server component (query + layout) for type-filtered pages.
Thin wrappers at named routes (takes precedence over `[slug]` in Next.js App Router):
- `bars/page.tsx` → `/venues/chicago/bars` — "Free Music Bars in Chicago"
- `breweries/page.tsx`, `parks/page.tsx`, `restaurants/page.tsx`, `amphitheaters/page.tsx`
Each has `generateStaticParams` covering all 108 cities + ISR revalidate=3600.

#### Neighborhood hub pages
`app/venues/[city]/neighborhood/[hood]/page.tsx` — on-demand rendering (no generateStaticParams). URL slug `lincoln-park` is resolved to canonical DB neighborhood string via `cityToSlug()` comparison against all distinct neighborhoods for that city.

#### Discovery links on venue list page
`app/venues/[city]/page.tsx` now renders a `HubLinks` server component above the filter UI:
- "Browse by type" colored chips — only shows types present in that city
- "Browse by neighborhood" gray chips — top 8 neighborhoods by venue count

#### Venue detail → neighborhood link
Neighborhood name in venue detail page (`app/venues/[city]/[slug]/page.tsx`) now links to the neighborhood hub.

### Architecture Notes
- Named routes (`bars/`, `neighborhood/`) always take precedence over dynamic `[slug]/` in Next.js App Router — safe to add without routing conflicts
- `cityToSlug()` from `lib/city-slugs.ts` is used for both generating neighborhood hub URLs and resolving slugs back to DB neighborhood strings
- Type hub pages import `VENUE_TYPE_CONFIGS` from `type-hub-page.tsx` — single source of truth for type metadata (slug, label, color)

### PageSpeed Results Summary (May 8, 2026)
| Metric | Before | After | Fix |
|--------|--------|-------|-----|
| Mobile score | 74 | **81** | Multiple fixes |
| Desktop score | — | **100** | — |
| LCP (mobile) | 5.4s | **4.1s** | Removed Clarity + JSON-LD from cards |
| TBT (mobile) | 600ms | **30ms** | Removed useSearchParams, fixed router.push on mount |
| Long tasks | 6 | **3** | JSON-LD removal |

**Root causes found and fixed:**
1. `useSearchParams()` — forced Suspense boundary, sent empty HTML. Fixed: removed, use `useEffect(window.location.search)` instead.
2. `router.push()` on every mount — triggered soft navigation during hydration. Fixed: `didInitRef` guard + `router.replace`.
3. Microsoft Clarity — 25 KiB JS + forced reflow (77ms). Fixed: removed entirely.
4. JSON-LD in every ConcertCard — 24× `buildJsonLd()` + `JSON.stringify()` during hydration. Fixed: removed from cards (stays on concert detail page).

**Still unresolved (known — not worth fixing now):**
- Render-blocking CSS: 6.9 KiB Tailwind bundle, 190ms load. Hard to fix without critical CSS inlining.
- Legacy JS polyfills (12 KiB) + Unused JS (65 KiB): Both come from `@swc/helpers/esm` — SWC's shared chunk for class syntax, generators, destructuring polyfills. A Next.js 15 SWC limitation — `browsersListForSwc` was removed in Next.js 15.x and there's no public API to set SWC browser targets. Only impacts first visits (browser-cached after that).

---

## Bundle Analysis

Run to identify large JS chunks and their sources:

```bash
ANALYZE=true npm run build
# Output: .next/analyze/client.html (open in browser)
```

### Current bundle (May 8, 2026)
First Load JS shared by all pages: **339 KiB**

| Chunk | Size | Contents |
|-------|------|----------|
| `255-*.js` | 65.4 KiB | `@swc/helpers/esm` — SWC polyfill helpers (class syntax, async/await, destructuring). Cannot reduce without switching from SWC to Babel. |
| `4bd1b696-*.js` | 54.2 KiB | Next.js router internals |
| `ed9f2dc4-*.js` | 217 KiB | React runtime + Next.js framework |
| other | 2.0 KiB | Page-level shared code |

### What to look for
- Large chunks from `node_modules` that aren't used on every page → mark as dynamic import
- Any library > 20 KiB appearing in a page-specific chunk → check if it can be removed or swapped
- `@swc/helpers` size growing → means more complex transpilation, check for class-heavy patterns

### Footer Nav — Phase 2 Complete (May 8, 2026)
`components/SiteFooter.tsx` — 12 city venue links hardcoded from top metros (NYC, LA, CHI, SF, AUS, SEA, DC, BOS, DEN, ATL, NSH, PDX). Used on homepage, venue list, venue detail, type hub, and neighborhood hub pages. Homepage uses an inlined version (client component can't import server components).
