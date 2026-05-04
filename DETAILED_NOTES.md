# Free Live Music — Detailed Session Notes

**Last Updated:** May 2, 2026  
**Session Goal:** Event submission system fully working with ISR live

---

## Architecture

### Database (Supabase)
```
concerts
  ├── artist_name, venue, date, time
  ├── city (10 metro codes: NYC, LA, SF, CHI, AUS, SEA, DC, BOS, DEN, PDX, NSH)
  ├── source_url, source_name, submitter_email
  └── created_at, updated_at

event_submissions
  ├── source_url, submitter_email, detected_city
  ├── status: 'pending' | 'approved' | 'rejected'
  ├── extracted_data (JSON: artist, venue, date)
  ├── concert_id (FK to concerts once approved)
  └── submitted_at

city_year_sequences
  └── Auto-increment IDs per city/year (for URL slugs)
```

### App Structure
```
app/
  ├── concerts/[city]/page.tsx        ← SSG + ISR (revalidate: 3600s)
  ├── moderation/page.tsx             ← Dashboard (pw: flm-mod-2026)
  ├── page.tsx                        ← Homepage
  ├── layout.tsx                      ← Global metadata (173+ cities)
  └── api/
      ├── moderation/get-submissions/route.ts
      ├── moderation/approve/route.ts  ← CORE: city mapping happens here
      └── submit-event/route.ts

lib/
  ├── city-slugs.ts                   ← Slug generation
  ├── extract-event-details.ts        ← URL parsing (OG tags → JSON-LD → patterns)
  ├── metros.json                     ← 200+ metros (lat/lon, metro codes)
  ├── data.ts                         ← getConcerts() + Supabase fallback
  ├── supabase.ts                     ← Client config
  └── types.ts                        ← Concert, City types

components/
  ├── SubmitEventModal.tsx            ← Form (URL + Email only)
  ├── ConcertCard.tsx                 ← Card display
  └── others...
```

---

## Features

### 1. City SEO Pages
- **Route:** `/concerts/[city]` (e.g., `/concerts/los-angeles`)
- **Generation:** SSG + ISR (revalidate every 3600s)
- **Content:** Dynamic title/desc, concert grid, cross-city links
- **Benefit:** New events appear within 1 hour of approval (no deploy needed)

### 2. Event Submissions
- **Form:** URL + Email (both required) + City/State (optional, auto-detected)
- **Endpoint:** `POST /api/submit-event`
- **Storage:** `event_submissions` table (status: pending/approved/rejected)
- **Link:** "Share a Free Event" button on homepage

### 3. Moderation Dashboard
- **URL:** `/moderation` (password: `flm-mod-2026`)
- **Features:**
  - Lists pending submissions with detected location
  - City dropdown (manual override takes priority)
  - Approve/Reject buttons
  - Real-time status + extracted data display

### 4. Event Extraction
- **Function:** `extractEventDetails(url)` in `lib/extract-event-details.ts`
- **Chain:** Open Graph → JSON-LD → Venue detection → URL patterns
- **Known Venues:** AT&T PAC (Dallas), Musicians Corner (Nashville), etc.
- **Fallback:** Case-insensitive city name lookup

### 5. ISR (Incremental Static Regeneration)
- **Config:** `export const revalidate = 3600` in city pages
- **Behavior:** Serves cached page, rebuilds in background every 1 hour
- **SEO Impact:** None — pages still static; Google treats as pre-generated
- **Advantage:** No manual deploy needed for new events

---

## Recent Fixes

✅ Form validation — now requires only URL + Email (not city/state)  
✅ Event routing — improved city detection + manual override in moderation  
✅ ISR enabled — new events appear within 1 hour (no deploy)  
✅ Homepage metadata — updated to mention 173+ cities  
✅ Moderation dashboard — city dropdown selector fully functional  

---

## Data Import Example

~56 Musicians Corner Nashville events (May-June 2026) imported:
- Hobo Cane, Teddy and the Rough Riders, Cedric Burnside, Howie Day, Amanda Shires, etc.
- All mapped to Nashville code (NSH)
- SQL files available in outputs

---

## Critical: City Code Priority Chain

1. **Manual Selection** (moderation dashboard) — HIGHEST
2. **Extracted City** (from event details)
3. **URL Pattern** (e.g., "attpac.org" → Dallas)
4. **State** (geo-mapping)
5. **NYC** (fallback)

City name lookup is **case-insensitive**.

---

## Testing Commands

```bash
# Build & verify
npm run build

# Check event city code
SELECT artist_name, venue, date, city FROM concerts 
WHERE artist_name LIKE '%Howie%' LIMIT 5;

# Clear old test data
DELETE FROM concerts WHERE source_name = 'Community Submission' AND date < '2026-05-01';

# Check pending submissions
SELECT id, source_url, submitter_email, status FROM event_submissions 
WHERE status = 'pending' ORDER BY submitted_at DESC;
```

---

## Known Limitations & Workarounds

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Event doesn't appear | ISR hasn't revalidated yet | Wait 1 hour or `git push` |
| Wrong city assigned | Auto-detection failed | Re-submit + manually select in moderation |
| "Venue TBD" extraction | Missing structured data on page | Manually pick city in moderation |
| Form won't submit | Email/URL validation | Check format in browser console |

---

## Future Enhancements (Backlog)

- [ ] Collect more venue data → improve `detectCityFromVenue()`
- [ ] API for Eventbrite/Ticketmaster feeds
- [ ] Image URLs in extracted events
- [ ] Admin panel: approved vs. verified events
- [ ] Analytics: which cities get most submissions
- [ ] Rate limiting on form submissions
- [ ] Email notifications on new submissions
- [ ] Export/sync to calendar APIs

---

## Env Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=<project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_MODERATION_PASSWORD=flm-mod-2026
```

