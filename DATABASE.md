# Database Reference — Free Live Music

---

## Schema Overview

### `concerts` Table
```sql
CREATE TABLE concerts (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  artist_name TEXT NOT NULL,
  venue TEXT,
  date DATE,
  time TIME,
  city VARCHAR(10),  -- Metro code: NYC, LA, SF, CHI, etc.
  source_url TEXT,
  source_name TEXT,  -- "Community Submission", "Eventbrite", etc.
  submitter_email TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### `event_submissions` Table
```sql
CREATE TABLE event_submissions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  source_url TEXT NOT NULL,
  submitter_email TEXT NOT NULL,
  detected_city VARCHAR(10),  -- Auto-detected city code
  manual_city_override VARCHAR(10),  -- User-selected from moderation UI
  status TEXT DEFAULT 'pending',  -- pending | approved | rejected
  extracted_data JSONB,  -- {artist, venue, date, time}
  concert_id BIGINT REFERENCES concerts(id),  -- Linked after approval
  rejection_reason TEXT,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  moderated_at TIMESTAMP,
  moderated_by TEXT
);
```

### `city_year_sequences` Table
```sql
CREATE TABLE city_year_sequences (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  city VARCHAR(10),
  year INT,
  next_seq INT DEFAULT 1,
  UNIQUE(city, year)
);
```

---

## City Codes

| Code | City | State | Notes |
|------|------|-------|-------|
| NYC | New York | NY | Fallback city |
| LA | Los Angeles | CA | |
| SF | San Francisco | CA | |
| CHI | Chicago | IL | |
| AUS | Austin | TX | |
| SEA | Seattle | WA | |
| DC | Washington | DC | |
| BOS | Boston | MA | |
| DEN | Denver | CO | |
| PDX | Portland | OR | |
| NSH | Nashville | TN | Has 56+ imported events |

---

## Common Queries

### Check pending submissions
```sql
SELECT 
  id, 
  source_url, 
  submitter_email, 
  detected_city,
  status,
  submitted_at
FROM event_submissions
WHERE status = 'pending'
ORDER BY submitted_at DESC;
```

### Find events in a specific city
```sql
SELECT 
  artist_name, 
  venue, 
  date, 
  time,
  source_url
FROM concerts
WHERE city = 'NSH'  -- or NYC, LA, SF, etc.
ORDER BY date ASC;
```

### Find events by artist
```sql
SELECT 
  artist_name, 
  venue, 
  date, 
  city
FROM concerts
WHERE artist_name ILIKE '%Howie%'  -- Case-insensitive
ORDER BY date;
```

### Count events per city
```sql
SELECT 
  city,
  COUNT(*) as event_count
FROM concerts
GROUP BY city
ORDER BY event_count DESC;
```

### Find submissions with wrong city assignment
```sql
SELECT 
  id,
  source_url,
  detected_city,
  manual_city_override,
  extracted_data
FROM event_submissions
WHERE status = 'approved'
AND detected_city != manual_city_override  -- Manual override was used
ORDER BY moderated_at DESC;
```

### Clean old test data (< May 1, 2026)
```sql
DELETE FROM concerts
WHERE source_name = 'Community Submission'
AND date < '2026-05-01';
```

### Check if city exists in reference table
```sql
SELECT * FROM city_year_sequences
WHERE city = 'NSH' AND year = 2026;
```

---

## City Mapping (Approval Logic)

When approving an event, the system follows this priority:

1. **Manual Selection** (moderation dashboard) — if user selected a city dropdown
2. **Extracted City** (from event details, e.g., "Dallas")
3. **URL Pattern** (venue detection, e.g., "attpac.org" → Dallas)
4. **State** (geo-mapping from address)
5. **NYC** (fallback)

**Code location:** `app/api/moderation/approve/route.ts`

---

## Extraction Data Format

When an event is submitted, `extracted_data` JSONB field stores:

```json
{
  "artist": "Howie Day",
  "venue": "Musicians Corner",
  "date": "2026-05-10",
  "time": "19:00",
  "description": "Free live performance",
  "detectedCity": "Nashville",
  "extractionMethod": "json-ld"
}
```

Possible extraction methods:
- `og-tags` — Open Graph meta tags
- `json-ld` — JSON-LD Event schema
- `venue-detection` — Known venue hardcodes
- `url-pattern` — Domain-based guess
- `manual` — User-provided in form

---

## Submission Workflow (Database View)

```
1. User submits form
   → INSERT INTO event_submissions (source_url, submitter_email, detected_city, status='pending')

2. You approve at /moderation
   → extractEventDetails(source_url)
   → INSERT INTO concerts (artist_name, venue, date, city, source_name='Community Submission')
   → UPDATE event_submissions SET status='approved', concert_id=NEW_CONCERT_ID

3. ISR revalidates in 1 hour
   → City page calls getConcerts(city)
   → Query: SELECT * FROM concerts WHERE city = 'NSH' ORDER BY date
   → Renders event on /concerts/nashville
```

---

## Backfilling Data

### Example: Import Nashville Events
```sql
INSERT INTO concerts (artist_name, venue, date, city, source_url, source_name)
VALUES
  ('Hobo Cane', 'Musicians Corner', '2026-05-03', 'NSH', 'https://example.com', 'Community Submission'),
  ('Teddy and the Rough Riders', 'Musicians Corner', '2026-05-10', 'NSH', 'https://example.com', 'Community Submission'),
  ('Cedric Burnside', 'Musicians Corner', '2026-05-17', 'NSH', 'https://example.com', 'Community Submission'),
  ('Howie Day', 'Musicians Corner', '2026-05-24', 'NSH', 'https://example.com', 'Community Submission'),
  ('Amanda Shires', 'Musicians Corner', '2026-05-31', 'NSH', 'https://example.com', 'Community Submission');
```

---

## Indexes (for performance)

Recommended indexes for common queries:

```sql
-- Fast lookup by city
CREATE INDEX idx_concerts_city ON concerts(city);

-- Fast lookup by date (for sorting)
CREATE INDEX idx_concerts_date ON concerts(date);

-- Fast lookup by status
CREATE INDEX idx_submissions_status ON event_submissions(status);

-- Fast lookup by submitted date
CREATE INDEX idx_submissions_submitted_at ON event_submissions(submitted_at DESC);
```

---

## Export Query (for backups)

```sql
-- Export all approved concerts as CSV
SELECT 
  artist_name,
  venue,
  date,
  time,
  city,
  source_url,
  submitter_email
FROM concerts
WHERE source_name = 'Community Submission'
ORDER BY city, date;
```

Then use `\copy` in psql or export from Supabase dashboard.

---

## Debugging Tips

### "Why didn't my event get approved?"
1. Check `event_submissions` table for status
2. If `rejected`, check `rejection_reason`
3. If `approved`, check `concert_id` is linked
4. Query concerts table: is the event there?

### "Event shows wrong city"
1. Check `detected_city` vs. `manual_city_override` in submissions
2. If override exists, that should win (see approval logic)
3. Double-check spelling in metro codes

### "Event isn't appearing on the city page"
1. Verify `city` code in concerts table matches metro code
2. Wait up to 1 hour for ISR revalidation
3. Or manually trigger: `git push` to Vercel

---

## Environment

**Supabase Project:** Via NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY  
**CLI Access:** `npx supabase ...` (requires local setup)  
**Dashboard:** https://app.supabase.com → Your Project → SQL Editor

