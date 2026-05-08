# Venue UX Roadmap

Designed May 8, 2026. Source: Opus cowork session.

---

## Context

6,300+ venues in DB across 108 cities (bars, breweries, restaurants, parks, malls, amphitheaters). Only a fraction have upcoming concerts linked. Venue pages need to be useful even with 0 shows.

**Core insight:** Concerts are the front door. Venues are the second click — users arrive from a concert card wanting context ("what else happens at this place?"). Design for that flow, not standalone venue browsing.

---

## Phase 1 — Core plumbing ✅ (May 8, 2026)

- [x] "Browse {City} venues →" link in homepage city header (`concerts-client.tsx`)
- [x] Venue name linked to venue detail page on `/concert/[slug]` when `venue_id` is set
- [x] Venue list page: "With upcoming shows" toggle, type filter chips, name search, "Shows this week" strip
- [x] Venue detail: music-schedule-aware 0-show empty state, "Nearby venues" section

---

## Phase 2 — Browse depth (next 2–4 weeks)

- [ ] Neighborhood hub pages: `/venues/[city]/neighborhood/[slug]`
- [ ] Venue type hub pages: `/venues/[city]/bars`, `/venues/[city]/breweries`, `/venues/[city]/parks`
- [ ] Site-wide shared `<TopNav>` component (Concerts | Venues | Submit)
- [ ] Footer nav with venue city list (top 8 cities by venue count)
- [ ] Run venue discovery on remaining low-count cities: SF, TB, RDU, SAV, DAL, FLG, CHS, KC, SYR, OMA

---

## Phase 3 — Map view (hold until Phase 2 shows traction)

- [ ] `/venues/[city]/map` — Mapbox with side panel, filterable by type
- [ ] "Venues near me" geolocation on homepage — surface 6 closest venues with shows this week
- All lat/lng data already stored for ~6,300 venues

---

## Phase 4 — Personalization (needs auth first)

- [ ] Save/favorite venues
- [ ] iCal feed for partner venues
- [ ] Partner tier UX: custom hero image, photo gallery, booking CTA

---

## Design decisions

**Concert card stays card-as-link** — don't nest anchors. Venue link goes on concert detail page, not the card.

**Empty state copy variants:**
- Has `music_schedule` → "No shows on the calendar yet — but {Venue} hosts live music {schedule}."
- Has `description` only → link to website, encourage checking there
- Has neither → "Submit a tip" CTA

**Nearby venues query:**
```sql
SELECT * FROM venues
WHERE city = $city AND neighborhood = $neighborhood AND id != $current
LIMIT 6
-- fallback: same city + same venue_type
```

**Static Mapbox thumbnail** (when implementing map preview):
```
https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/pin-s+f43f5e({lng},{lat})/{lng},{lat},14,0/600x300@2x?access_token=...
```

---

## Files modified in Phase 1

- `app/concerts-client.tsx` — venues entry-point link
- `app/concert/[slug]/page.tsx` — venue name linked when venue_id set
- `app/venues/[city]/page.tsx` — filter chips, search, shows-this-week strip (client component)
- `app/venues/[city]/[slug]/page.tsx` — nearby venues, 0-show empty state
