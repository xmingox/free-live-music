# freelivemusic.co — Strategic Roadmap
> Generated: May 10, 2026 | Source: Claude Opus strategic review
> Last updated: May 10, 2026 (end of session 5)

---

## Current State (as of May 10, 2026 — end of session 5)

### What's built ✅
- **57 structured importers** in `lib/importers/` (NYC Parks, SummerStage, Getty, LACMA, Grand Performances, Lincoln Center, Levitt LA, Naumburg, Bryant Park, NY Phil, Hudson Yards, Stern Grove, SF/Chicago/Austin/DC/Boston/Denver/Portland/Seattle city importers, 30+ OC/LA city importers)
- **Daily cron** at 06:00 UTC via `vercel.json` → `/api/import` (all importers, direct write to `concerts`)
- **9 cron jobs** in `vercel.json` — endpoints exist at `/api/maintenance/*` and `/api/import/search`; untested end-to-end
- **`event_submissions` table** — exists, currently only for user-submitted events
- **`/moderation` page** — exists, password-protected, handles user submissions only
- **`metro_crawl_log` table** — exists in DB
- **`music_score` column on venues** — exists in DB (referenced in sitemap filter and venue noindex logic)
- **57+ venue type hub pages** (bars, breweries, parks, restaurants, amphitheaters, coffee-shops per city) with `ItemList` JSON-LD
- **Neighborhood hub pages** — on-demand rendering, with `ItemList` JSON-LD
- **`MusicEvent` JSON-LD** on concert detail pages, **`MusicVenue` JSON-LD** on venue detail pages
- **`FAQPage` JSON-LD** on city listing pages
- **`ItemList` JSON-LD** on city listing pages (top 20 events), type-hub pages, neighborhood hub pages
- **`BreadcrumbList` JSON-LD** on tonight/this-week/this-weekend/artist/concert pages
- **`MusicGroup` JSON-LD** on artist pages
- **Sitemap** — 5-tier: concerts, cities, state hubs, venues, type-hubs + artist entries (gated 3+ shows, 14+ days out)
- **`/tonight/[city]`**, **`/this-week/[city]`**, **`/this-weekend/[city]`** — timezone-aware (city-local date via IANA tz)
- **`/this-week/[city]`** — Mon–Fri window, grouped by day, ISR 1h
- **`/concerts/[city]/feed.xml`** — Atom 1.0 feed, RSS autodiscovery in city page metadata
- **`/artist/[slug]`** — artist schedule pages, on-demand ISR, resolves by slug→name
- **`/free-concerts/[state]`** — 47 state hub pages, city grid sorted by show count, `ItemList` JSON-LD
- **Internal linking** on concert detail: "More at this venue", "More in {neighborhood}", "More in {city}" sections
- **Past concerts** — noindex + "show has passed" page (replaced 308 redirect)
- **Venue noindex** — venues with 0 upcoming shows + no music_schedule now get `robots: noindex`
- **PageSpeed: 99/100 mobile** (May 10, 2026)
- **non-www → www** — 308 permanent redirect in `next.config.ts`

### Key gaps (as of May 10, 2026)
- `event_submissions` queue not used by automated pipeline (importers write directly to `concerts`)
- `scrape-concerts.ts` outputs JSON file instead of writing to submissions queue
- No `cron_runs` audit table (crons run blind — no success/failure tracking)
- `last_checked_at` column missing from venues
- `ImportRow.city` type only covers 10 cities (`'NYC' | 'LA' | 'SF' | ...`)
- `supabase/schema.sql` is stale
- No per-event analytics (views, outbound clicks)
- Home page deep links (`/?city=NYC&date=tonight`) not server-rendered → uncrawlable
- Footer only links to 12 cities (roadmap calls for 30)
- 551 venue pages "crawled not indexed" (thin content) — venue noindex fix deployed, will take weeks to reflect
- 2,090 pages "discovered not indexed" — non-www URLs in Google's crawl queue, resolving via 308 redirect
- Top-25 city evergreen pages not built
- PWA service worker not built

---

## Architecture Decision: The Unified Pipeline

**Problem:** Two parallel pipelines don't talk to each other.
- Structured importers → direct `concerts` insert
- `scrape-concerts.ts` → JSON file → manual SQL paste

**Solution:** Route all non-trusted ingest through `event_submissions` as a buffer.
- Trusted sources (NYC Parks, Bryant Park — <5% historical rejection) → keep direct `concerts` insert with `is_verified=true`
- Everything else → `event_submissions` with `status='pending'`
- Human reviews `event_submissions` in `/moderation` → approves → copies to `concerts`
- Automated pre-classification flags rows as `auto_approve_eligible=true` if they pass rules

---

## 8-Week Implementation Timeline

### Week 1–2: Foundation (Pipeline + DB)

#### DB Changes
- [ ] Add to `event_submissions`: `source_extractor`, `city_code`, `extracted_genre`, `extracted_neighborhood`, `extracted_admission_type`, `extracted_indoor_outdoor`, `auto_approve_eligible`, `review_notes`
- [ ] Add `music_score` (integer) to `venues` table
- [ ] Add `last_checked_at` (timestamptz) to `venues` table
- [ ] Create `cron_runs` table: `(id, name, started_at, finished_at, success, stats_json, error_message)`
- [ ] Expand `ImportRow.city` union type to cover all 177 metro codes

#### Pipeline Changes
- [ ] Move `scrape-concerts.ts` extraction logic into `lib/importers/_generic-search.ts`
- [ ] Wire `_generic-search.ts` into `/api/import/search` endpoint (new endpoint, rotates 25 cities/week)
- [ ] Output goes to `event_submissions`, NOT JSON file
- [ ] Update `event_submissions` moderation page to show pipeline submissions alongside user submissions
- [ ] Add `auto_approve_eligible` pre-classification logic (trusted source + no overlap + date ≥ 3 days out)

#### Admin Health Page
- [ ] Create `/admin/health` page (password-protected)
  - Last 30 cron runs with status/stats
  - Per-source event counts and rejection rates
  - Venue health summary (music_score distribution)

---

### Week 3–4: SEO + Past-Event Cleanup

#### 410 Gone for past/removed concerts
- [ ] When concert `date < today`, return 410 Gone (not 404) from `/concert/[slug]`
- [ ] Add `redirects` table: `(from_slug, to_path)` — redirect past concerts to venue or series page
- [ ] Same for venues with `music_score < 0` → return 410

#### Structured data upgrades
- [ ] Add `ItemList` JSON-LD to city listing pages (`/concerts/[city]`)
- [ ] Add `ItemList` JSON-LD to type-hub pages (`/venues/[city]/bars`)
- [ ] Add `ItemList` JSON-LD to neighborhood hub pages
- [ ] Change `Event` → `MusicEvent` on concert detail pages
- [ ] Change `PerformingGroup` → `MusicGroup` for band performers

#### Internal linking
- [ ] Concert detail: add "More at this venue" + "More in {neighborhood}" + "More {genre} in {city}" sections (8-10 related shows)
- [ ] Venue detail: add "Other free music venues nearby" (3-4 neighbors) + link to type-hub
- [ ] Type-hub: add links to sibling type-hubs, neighborhood hubs
- [ ] Footer: expand from 12 to 30 cities + type-hub anchors

---

### Week 5–6: Full Cron Set

Add 7 more crons to `vercel.json`:

| Cron | Path | Schedule | Purpose |
|---|---|---|---|
| Generic search ingest | `/api/import/search` | `0 8 * * 1` (Mon) | Brave+Haiku for cities without importers, 25/week |
| Eventbrite ingest | `/api/import/eventbrite` | `0 7 * * 2` (Tue) | Direct Eventbrite API |
| Past-event sweep | `/api/maintenance/past-events` | `15 5 * * *` (daily) | Archive past concerts, write redirect map |
| Venue health | `/api/maintenance/venue-health` | `0 4 * * 0` (Sun) | HEAD-check websites, refresh Google status, recompute music_score |
| ISR warm | `/api/maintenance/warm` | `30 6 * * *` (daily after import) | Pre-populate ISR cache for top-50 city pages |
| IndexNow ping | `/api/maintenance/indexnow` | `*/30 * * * *` | Ping Bing with newly approved concerts |
| Search Console pull | `/api/analytics/gsc` | `0 12 * * *` | Pull impressions/CTR into search_metrics table |

---

### Week 7–8: Content + Monetization

- [ ] Top-25 city evergreen pages: "Free Live Music in {City} — Where to Find It Year-Round" (~600 words, Haiku-generated, lightly edited)
- [ ] `FAQPage` JSON-LD on city listing pages
- [ ] PWA service worker (cache current city events on first load)
- [ ] Audit Apify spend vs. importer coverage — cut if redundant
- [ ] Expand affiliate set beyond Booking.com (Resy, GetYourGuide, OpenTable for restaurant venues)

---

## Ongoing / Backlog

### Concert Detail Page — Trust Signals + User Reporting
> Reviewed with Opus, May 10, 2026. Do not build yet — archive for implementation reference.

#### Source verification nudge (quick, ~15 min)
Add inline muted text **directly below the "View Official Listing" button**:
- Default: *"Schedules can change. Confirm with the official source before heading out."*
- If `last_verified_at` > 7 days old: *"Last verified [N days] ago — double-check the official listing."*
- If `artist_name` contains "TBA": *"Performer not yet announced — check source for updates."*
- Not a banner or footer disclaimer — inline with the CTA, smaller muted text only

#### User event reporting form (medium, ~2 hours)
- **"Report an issue" text link** at bottom of concert detail page (not floating)
- Opens inline form/dialog with:
  - Issue type (radio): `Cancelled` / `Wrong date or time` / `Wrong artist` / `Source link broken` / `Other`
  - Optional comment (textarea, 280 chars max)
  - Optional email (anonymous fine — requiring email cuts submissions ~70%)
- **DB storage**: new `event_reports` table — `(id, concert_id, issue_type, comment, reporter_email, created_at, status, ip_hash)`
- **Notifications**: Resend API → email to owner on each insert (or daily digest if volume grows). Env var: `RESEND_API_KEY`
- **No admin UI yet** — query Supabase directly until >20 reports/week
- **Anti-spam**: honeypot field + 3 reports/hour/IP rate limit. Skip CAPTCHA until abuse appears
- **Do not use Gmail as a destination** — use Resend to forward to existing email; reports live in DB

### Analytics
- [ ] Add `event_views` and `outbound_click_count` to `concerts` table
- [ ] Track via `/api/track` beacon or Vercel Analytics join
- [ ] Surface on `/admin/health`

### Home page SEO
- [ ] Make `/?city=NYC&date=tonight` server-rendered — extend `/concerts/[city]` pattern to home
- [ ] Consider `/tonight`, `/this-weekend` as SSR routes

### Venue discovery improvements
- [ ] Better Google Places query mix: `"open mic night" {City}`, `"happy hour live music"`, `"sunday brunch live music"`
- [ ] iCal feed discovery on parks/library event pages (`.ics` URLs)
- [ ] CivicPlus / Granicus / Drupal Recreation CMS template importers (one template → dozens of cities)
- [ ] Library system calendars (NYPL, LAPL, BPL, Seattle, Chicago)

### Schema cleanup
- [ ] Update `supabase/schema.sql` to match production (remove `CHECK (city IN ('NYC', 'LA'))`, add all 177 metro codes)
- [ ] `ImportRow.city` type → expand or replace union with `string` + runtime validation

### Music score (venue health) computation
- Scoring signals (weekly job):
  - `+30` — concerts in last 90 days referencing this venue
  - `+20` — upcoming concerts referencing this venue
  - `+10` — website reachable (HTTP 200)
  - `+10` — Google `business_status === OPERATIONAL`
  - `+5` — music keywords in description/music_schedule
  - `−40` — Google `business_status === CLOSED_PERMANENTLY`
  - `−20` — website 4xx/5xx for 14+ days
  - `−30` — 0 concerts in 365 days AND venue_type ∈ {bar, restaurant, brewery, coffee_shop}
- Display: hide venues with `music_score < 20` on type-hub pages by default
- Sitemap: exclude venues with `music_score < 0`
- Venue detail: return `410 Gone` when `music_score < -50`

---

## Source Quality Tracking

Target per-source rejection rates (tracked in `event_submissions.source_extractor`):

| Extractor | Trust Level | Pipeline Path |
|---|---|---|
| `importer:nyc-parks` | Trusted | Direct → `concerts` |
| `importer:bryant-park` | Trusted | Direct → `concerts` |
| `importer:getty` | Trusted | Direct → `concerts` |
| `importer:lacma` | Semi-trusted | → `event_submissions`, auto-approve-eligible |
| `importer:*` (others) | Semi-trusted | → `event_submissions`, auto-approve-eligible |
| `haiku:scrape-concerts` | Review required | → `event_submissions`, manual review |
| `user-submitted` | Review required | → `event_submissions`, manual review |
| `eventbrite` | Review required | → `event_submissions`, manual review |

Promote extractor to "trusted" when 30-day rolling rejection rate < 5%.

---

## SEO Structured Data Checklist

| Page type | JSON-LD present | Missing |
|---|---|---|
| Concert detail `/concert/[slug]` | `Event` + `BreadcrumbList` | Change to `MusicEvent` |
| Venue detail `/venues/[city]/[slug]` | `MusicVenue` | — |
| City listing `/concerts/[city]` | None | `ItemList` of Events |
| Type hub `/venues/[city]/bars` | None | `ItemList` of Places |
| Neighborhood hub | None | `ItemList` of Places |
| Home `/` | None | `ItemList` or `WebSite` |
| City venue list `/venues/[city]` | None | `ItemList` of Places |

---

## Cron Safety Requirements (all endpoints)
- Bearer auth: `Authorization: Bearer ${CRON_SECRET}`
- Each run writes to `cron_runs` table with `(name, started_at, finished_at, success, stats_json, error_message)`
- Each importer wrapped in `Promise.allSettled` with 30s per-source timeout
- Errors structured as `{source, error_class, sample_url}` not raw strings
- `/admin/health` surfaces last 30 runs per cron name

---

## Files Reference

| File | Purpose |
|---|---|
| `lib/importers/index.ts` | Orchestrator — runs all structured importers |
| `lib/importers/types.ts` | `ImportRow` type (city union stale — 10 cities only) |
| `lib/importers/_generic-search.ts` | (TO CREATE) Brave+Haiku generic scraper |
| `scripts/scrape-concerts.ts` | Brave+Haiku scraper (to be refactored into lib) |
| `scripts/discover-venues.mjs` | Google Places venue discovery |
| `scripts/enrich-venues.mjs` | Google Places venue enrichment |
| `app/api/import/route.ts` | Cron-authorized import endpoint |
| `app/api/import/search/route.ts` | (TO CREATE) Generic search import endpoint |
| `app/api/maintenance/*.ts` | (TO CREATE) Maintenance cron endpoints |
| `app/moderation/page.tsx` | Moderation UI (user submissions only — needs update) |
| `app/admin/health/page.tsx` | (TO CREATE) Admin health dashboard |
| `app/concert/[slug]/page.tsx` | Concert detail — has Event + BreadcrumbList JSON-LD |
| `app/venues/[city]/[slug]/page.tsx` | Venue detail — has MusicVenue JSON-LD |
| `app/sitemap.ts` | 4-tier sitemap |
| `vercel.json` | Currently 1 cron — needs 7 more |
| `supabase/schema.sql` | Stale — needs full regeneration |
