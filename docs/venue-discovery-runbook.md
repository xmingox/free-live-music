# Venue Discovery Runbook

How to find and add new free live music venues to freelivemusic.co.

---

## Overview

Three scripts handle the full pipeline:

| Script | Purpose |
|--------|---------|
| `scripts/discover-venues.mjs` | Search Google Places for new venues in a city |
| `scripts/enrich-venues.mjs` | Fill in address, coordinates, website, phone for unenriched venues |
| Vercel redeploy | Clear ISR cache so new data appears on the site |

---

## Step-by-Step Process

### 1. Discover candidate venues (dry run)

```bash
node scripts/discover-venues.mjs <CITY_CODE>
```

This searches Google Places across 13 query types (bars, jazz clubs, open mics, breweries, restaurants, coffee shops, cafes, rooftop bars, shopping malls, shopping centers) and prints a ranked list of venues **not yet in the database**.

**Examples:**
```bash
node scripts/discover-venues.mjs NYC
node scripts/discover-venues.mjs CHI
node scripts/discover-venues.mjs LA
```

**Flags:**
```bash
--min-rating=4.2     # Hide venues below this Google rating (reduces noise in big cities)
--all-types          # Also surface parks and amphitheaters (mostly ticketed — review carefully)
--insert             # Write candidates to the database (combine with other flags)
```

**What gets filtered out automatically:**
- Ticketed venue types: amphitheaters, performing arts theaters, stadiums (unless `--all-types`)
- Name keyword blacklist: Theater, Theatre, Palladium, Ballroom, Auditorium, Arena, Improv, Comedy Club, Opera House, Concert Hall
- Venue types never relevant: schools, museums, libraries, churches, farmers markets

**Recommended starting point for most cities:**
```bash
node scripts/discover-venues.mjs NYC --min-rating=4.2
```

---

### 2. Review the candidate list

The output is sorted by Google rating (highest first). Scan for:

- **Keep:** bars, breweries, coffee shops, restaurants, shopping centers with outdoor stages
- **Skip manually if needed:** comedy venues (sometimes slip through), hotel bars with cover charges, karaoke bars
- **Note:** venues with no rating or very few reviews are lower confidence

---

### 3. Insert approved venues

```bash
node scripts/discover-venues.mjs <CITY_CODE> --insert
# or with rating filter:
node scripts/discover-venues.mjs <CITY_CODE> --min-rating=4.2 --insert
```

The script auto-generates slugs in the format `{venue-name}-{city-code}` (e.g. `harvard-and-stone-la`).

---

### 4. Enrich any venues missing details

The discovery script fills in most fields from Google Places during insert. Run the enrichment script to catch anything that was missed, or to re-enrich venues added manually:

```bash
node scripts/enrich-venues.mjs
```

This fills in: `address`, `lat`, `lng`, `website`, `phone`, `google_place_id`, `venue_type`, `updated_at`.

It skips venues that already have a `google_place_id`.

---

### 5. Redeploy Vercel to clear ISR cache

New venues won't appear on the site until the ISR cache clears (up to 1 hour) or you manually redeploy:

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Open **free-live-music-1lwp**
3. Latest deployment → three-dot menu → **Redeploy**
4. Wait ~30–60 seconds
5. Check `/venues/{city-slug}` in a new private window

---

## Venue Types Reference

Valid `venue_type` values in the database:

| Type | Description |
|------|-------------|
| `park` | City parks, outdoor green spaces |
| `amphitheater` | Outdoor amphitheaters, large outdoor stages |
| `plaza` | Public plazas, town squares |
| `bar` | Bars, pubs, lounges, rooftop bars |
| `restaurant` | Restaurants, cafes, coffee shops |
| `brewery` | Craft breweries with taprooms |
| `mall` | Shopping malls, shopping centers, outdoor plazas |
| `farmers_market` | Farmers markets |
| `church` | Churches and places of worship |
| `library` | Public libraries |
| `school` | Schools and universities |
| `museum` | Museums and cultural institutions |
| `community_center` | Community centers and rec centers |
| `rooftop` | Dedicated rooftop venues |
| `other` | Everything else |

---

## City Codes Reference

Common codes used in the database:

```
NYC  Los Angeles=LA   Chicago=CHI    Houston=HOU    Phoenix=PHX
SF   Seattle=SEA      Denver=DEN     Austin=AUS     Nashville=NSH
Portland=PDX  Atlanta=ATL  Miami=MIA  Dallas=DAL  Boston=BOS
DC   San Diego=SD     Baltimore=BAL  St. Louis=STL  Jacksonville=JAX
Omaha=OMA    San Antonio=SAT  Orange County=ANA  Santa Barbara=SBA
```

Full list in `lib/metros.json`.

---

## Manual Venue Insert (SQL)

For one-off venues found outside the script:

```sql
INSERT INTO venues (slug, name, city, neighborhood, venue_type, indoor_outdoor)
VALUES ('venue-name-citycode', 'Venue Name', 'NYC', 'Brooklyn', 'bar', 'indoor');
```

Then run `node scripts/enrich-venues.mjs` to auto-fill the rest.

---

## Troubleshooting

**Venues not showing on the site after insert**
→ Redeploy Vercel to clear the 1-hour ISR cache.

**Script says "Missing GOOGLE_PLACES_API_KEY"**
→ Add the key to `.env.local`:
```bash
echo "GOOGLE_PLACES_API_KEY=your-key-here" >> .env.local
```
Also add it to Vercel: Dashboard → free-live-music-1lwp → Settings → Environment Variables.

**Venue page shows wrong type badge (e.g. "Amphitheater" for a bar)**
→ Google Places sometimes misclassifies. Fix manually:
```sql
UPDATE venues SET venue_type = 'bar' WHERE slug = 'venue-slug-here';
```

**Script errors with "permission denied"**
→ Run this in Supabase SQL editor:
```sql
GRANT SELECT, INSERT, UPDATE, DELETE ON venues TO service_role;
```

---

## Adding a New City (Full Checklist)

When expanding to a city not yet on the site:

- [ ] Add metro entry to `lib/metros.json` (code, city, state, aliases)
- [ ] Add city code to `City` type union in `types/index.ts`
- [ ] Add the 3-letter code to the `aliases` array in metros.json
- [ ] Run `node scripts/discover-venues.mjs <CODE> --insert`
- [ ] Run `node scripts/enrich-venues.mjs`
- [ ] Research free concerts → INSERT into `concerts` table
- [ ] Redeploy Vercel
- [ ] Verify at `/venues/{city-slug}` and `/concerts/{city-slug}`
