# Concert Research Process

Used by Claude Code to find, verify, format, and insert free concert events for a given city.

---

## Step-by-Step Process

### 1. Confirm City Code
- Check `lib/metros.json` for the city's `code` (e.g. STL, BAL, RIC)
- Confirm the code is in the `aliases` array — if not, add it
- Confirm the code is in `types/index.ts` City type — if not, add it

### 2. Web Search
Run two searches in parallel:
- `"free outdoor concerts [CITY] 2026 summer series"`
- `"[CITY] free live music events 2026 schedule"`

### 3. Fetch Top Sources
From search results, fetch 2–4 of the most promising URLs:
- Local magazine "best of" lists (e.g. stlmag.com, baltimoresun.com)
- City/parks department event pages
- Tourism board sites (e.g. explorestlouis.com, baltimore.org)
- Known venue/series websites

Extract per source:
- Series name
- Venue name
- Neighborhood/area
- Specific dates (not just "every Thursday")
- Start time
- Genre if mentioned

### 4. Verify & Filter
Before including an event, confirm:
- [ ] Free admission (not just "free parking" or "free with museum admission")
- [ ] Date is >= today (no past events)
- [ ] Specific date known (not just "summer 2026")
- [ ] Location is in or near the target city

### 5. Format Data
All fields must match the database schema exactly:

| Field | Format | Example |
|-------|--------|---------|
| `artist_name` | Series or performer name | `"Whitaker Music Festival"` |
| `venue` | Full venue name | `"Missouri Botanical Garden"` |
| `neighborhood` | Neighborhood or district | `"Tower Grove"` |
| `city` | 3-letter metro code | `"STL"` |
| `date` | YYYY-MM-DD | `"2026-06-03"` |
| `time` | 12-hour, no space, lowercase | `"7:00pm"` |
| `genre` | Single word or short phrase | `"Blues"` / `"Various"` |
| `price` | Always | `"Free"` |
| `admission_type` | Walk-up or RSVP | `"Walk-up free"` / `"Free RSVP"` |
| `is_verified` | Always | `true` |
| `slug` | kebab-case + city + date | `"series-name-stl-2026-06-03"` |
| `source_name` | Publication or org name | `"STL Mag"` |
| `source_url` | Direct URL to source | `"https://..."` |

**Time format rules:**
- Use 12-hour format with lowercase am/pm, no space: `7:00pm`, `10:30am`
- Never use 24-hour format (`19:00`) — the DB has one bad `18:00` record already
- Never use uppercase AM/PM or space before am/pm

### 6. Show Data for Review
Present all events in a formatted table grouped by series.
**Always pause here — do not insert until user says "insert".**

### 7. Insert into Supabase
Use the Supabase MCP `execute_sql` tool to INSERT all records.
Verify with: `SELECT city, COUNT(*) FROM concerts WHERE city = '[CODE]' GROUP BY city;`

### 8. Add City Alias to metros.json
Add the 3-letter code to the city's `aliases` array in `lib/metros.json`.
Commit and push so frontend filter matches the new events.

### 9. Update CLAUDE.md
Append session summary with:
- City name and code
- Number of events inserted
- Series names and date ranges
- Any bugs or issues encountered

---

## Common Pitfalls

| Problem | Cause | Fix |
|---------|-------|-----|
| Events not showing on frontend | Code not in `aliases` array in metros.json | Add code to aliases |
| NaN on concert detail page | Time stored in 24-hour format | Always use 12-hour format |
| 0 events despite DB records | City code not in `types/index.ts` | Add to City type union |
| Events cut off | Supabase 1000-row default limit | `lib/data.ts` now uses `.limit(5000)` |
| Wrong city filtering | metro.city name doesn't match DB value | Use aliases array |

---

## Sources to Check Per City

| Source Type | Examples |
|-------------|---------|
| Local alt-weekly / magazine | Baltimore Magazine, Richmond Magazine |
| City parks & rec | [city].gov/parks/events |
| Tourism board | baltimore.org, visitrichmondva.com |
| Do314/Do502 style local guides | do410.com (Baltimore) |
| Venue-specific sites | Known amphitheaters, parks, waterfront orgs |

---

Last Updated: May 7, 2026
