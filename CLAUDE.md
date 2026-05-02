# Free Live Music — Project Context

## What this is
A Next.js 15 site listing free live music concerts across the US. Users browse by city and date filter. Community members can submit events via a modal form. A password-gated moderation dashboard lets the curator approve/reject submissions, which auto-extracts event details and publishes to the concerts table.

## Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Supabase (Postgres)
- **Styling**: Tailwind CSS
- **Deployment**: Vercel
- **Analytics**: Google Analytics (G-HE4QED3BWS)

## Key files

### Pages
- `app/page.tsx` — home page, fetches concerts from Supabase, falls back to mock data
- `app/concerts-client.tsx` — client component: state/metro dropdowns, date filters, concert grid
- `app/concert/[slug]/page.tsx` — individual concert detail page
- `app/sources/page.tsx` — transparency page listing all data sources by metro
- `app/moderation/page.tsx` — password-gated moderation dashboard (client component)

### API routes
- `app/api/submit-event/route.ts` — accepts community submissions, writes to `event_submissions` table
- `app/api/moderation/get-submissions/route.ts` — fetches all submissions (no auth — consider adding)
- `app/api/moderation/approve/route.ts` — approves or rejects a submission; on approve, scrapes the URL and inserts into `concerts`
- `app/api/import/route.ts` — runs all importers (called by Vercel Cron + manual trigger via Bearer token)
- `app/api/debug/route.ts` — debug endpoint

### Components
- `components/ConcertCard.tsx` — concert card UI
- `components/SubmitEventModal.tsx` — community submission modal; state → city cascading selects driven by `lib/metros.json`
- `components/DateFilter.tsx` — Tonight / Weekend / Next 7 Days / All Shows / Custom Dates filter bar
- `components/CityToggle.tsx` — legacy component (superseded by state/metro dropdowns in concerts-client)

### Data & utilities
- `lib/metros.json` — 200+ US metros with `{ code, city, state, region }`
- `lib/extract-event-details.ts` — scrapes a URL for Open Graph tags, JSON-LD, and date/time patterns
- `lib/data.ts` — Supabase data fetching helpers
- `lib/mock-data.ts` — fallback mock concerts for local dev without DB
- `lib/importers/` — per-source scrapers (NYC Parks, SummerStage, Stern Grove, etc.)

### Types
- `types/index.ts` — `Concert`, `City`, `DateFilter` types
  - `City` is currently the original 10 metros: `'NYC' | 'LA' | 'SF' | 'CHI' | 'AUS' | 'SEA' | 'DC' | 'BOS' | 'DEN' | 'PDX'`
  - `DateFilter` includes `'custom'` for date range picker

## Supabase tables
- `concerts` — main events table
- `event_submissions` — community submissions with status (`pending` / `approved` / `rejected`), extracted fields, and `concert_id` FK

### Required Supabase permissions
```sql
GRANT SELECT, INSERT ON public.event_submissions TO service_role;
GRANT SELECT, INSERT ON public.concerts TO service_role;
ALTER TABLE event_submissions ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE event_submissions ADD COLUMN IF NOT EXISTS published_at timestamptz;
```

## Environment variables
| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only) |
| `EVENTBRITE_API_KEY` | Eventbrite importer |
| `CRON_SECRET` | Bearer token for `/api/import` |
| `MODERATION_PASSWORD` | Password for `/moderation` page (server-side check) |
| `NEXT_PUBLIC_MODERATION_PASSWORD` | Same password exposed to client (fallback) |

## Known issues / TODOs
- `app/api/moderation/get-submissions/route.ts` has no auth — anyone can read submissions including emails
- `City` type in `types/index.ts` is hardcoded to 10 metros but `metros.json` has 200+; the `as City` casts in concerts-client work around this
- `components/CityToggle.tsx` is unused — can be deleted
- Git committer name shows as "a <b@as-MacBook-Neo.local>" — fix with `git config --global user.name` and `user.email`

## Moderation workflow
1. User submits event via "Share Event" modal → saved to `event_submissions` with `status: pending`
2. Curator visits `/moderation`, enters password (`flm-mod-2026` locally)
3. Dashboard loads all submissions via `GET /api/moderation/get-submissions`
4. Curator clicks Approve → `POST /api/moderation/approve` with `action: approve`
5. Route scrapes the URL via `extractEventDetails`, maps city/state to metro code, inserts into `concerts`, updates submission to `approved`
6. On duplicate URL → returns 409

## Metro mapping logic (approval route)
1. Try exact city name match (case-insensitive) against `metros.json`
2. Fallback: first metro in the submitted state from `metros.json`
3. Final fallback: `'NYC'`
