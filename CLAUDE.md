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

- `app/concerts-client.tsx` — home page client component, reads `?city=` param via `useSearchParams()`, filters client-side
- `app/concerts/[city]/page.tsx` — metro city SSR page
- `app/concerts/city/[alias]/page.tsx` — alias city SSR page
- `lib/metros.json` — metro definitions with city codes and aliases
- `lib/data.ts` — Supabase query helpers, alias-aware
- `lib/city-slugs.ts` — slug helpers

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

Done ✅: DB setup, Eventbrite import (829 events), Next.js 15.3.1, metro alias fixes, alias city pages, ISR, domain fix

In Progress 🔄: Deduplication bug, sitemap concert pages, SEO architecture

Planned ⏳: Search Console submission, dynamic meta tags, genre/date filtering, event page improvements, user submissions, push notifications, more data sources (LA Parks, Hollywood Bowl, Grand Performances, KCRW)
