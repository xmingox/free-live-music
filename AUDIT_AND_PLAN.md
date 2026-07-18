# freelivemusic.co — Consolidated Audit & Prioritized Plan
> Compiled July 18, 2026. Synthesizes three independent audit passes (code + live Supabase) into one grounded plan.
> All numbers verified against the production DB (project `rxdutrcjkmfhonzpsthb`) and the repo at time of writing.

---

## The one-paragraph diagnosis

freelivemusic.co is a well-engineered programmatic directory pointed at the wrong game. It bets almost everything on SEO — the slowest-compounding channel for a zero-authority domain — in the one SERP category (local events) that Google increasingly answers inline. Its data model represents only **dated events**, which expire and cause a severe autumn supply collapse, while it is structurally blind to the **recurring free-music residencies** (Nashville honky-tonks, Fremont Street, NYC year-round venues) that make the highest-demand markets high-demand. The engineering problems (route sprawl, per-request DB reads, a daily timezone bug, broken SEO instrumentation) are real and worth fixing, but the strategic mismatch is the thing that caps the ceiling.

**The evidence that reframes everything:** across ~6 weeks of Search Console data before instrumentation broke, the entire 7,509-venue directory and every city hub earned **zero clicks**. All ~25 lifetime clicks came from individual event/artist pages. Breadth has produced nothing measurable; every signal points at depth.

---

## What's actually good (keep, don't touch)

410-Gone policy for expired events, `previous_slug` 301 redirect support, partial indexes for the archive sweep, per-source dedupe keys, the working `is_archived` sweep cron, www canonical enforcement, and noindex discipline on date-volatile pages. The SEO *instincts* in this codebase are sound; the problems are sprawl, duplicated logic, broken feedback loops, and strategic aim.

---

## Key findings (grounded)

### Supply & freshness
- **Autumn cliff, live now.** Future events by month: Jul 537 / Aug 827 / Sep 174 / Oct 39 / Nov 11 / Dec 12. Only **62 events dated after Sep 30** across 24 sources. Active cities collapse 126 (Aug) → 22 (Oct).
- **Cause is structural.** ~50 of ~55 importers in `lib/importers/` are hardcoded static arrays of summer-2026 dates. Only 5 are live scrapers. The Brave+Haiku generic extractor (`lib/importers/_generic-search.ts`) has produced **10 rows ever, 1 pending** — effectively dead.

### SEO instrumentation & demand
- **Flying blind since mid-May.** `seo-daily` ~71 runs / 2 ok; `gsc-pull` ~68 / 8; last `search_metrics` row **2026-05-18**. Alerts don't escalate failure streaks.
- **Demand is not where the domain name points.** "free concerts [city]" head terms: ~166 impressions, avg pos ~47, losing to TimeOut / tourism boards. The only proven demand: **named series + year** (pos ~14) and **named artists playing free shows** (pos 5–11). City hubs and the venue directory: **0 clicks ever**.
- **Las Vegas gap.** High demand (Fremont Street, "free live music las vegas"), weak incumbents (venue pages + thin affiliate sites, no TimeOut lock) — and the DB holds **3 future Vegas events** with **no Vegas importer**. Fremont Street is free, nightly, year-round: the highest-demand *and* most cliff-proof source in the country, absent.

### SEO hygiene / architecture
- **Route sprawl.** One city's content spread across up to 9 URL families, including two duplicate hand-written guide systems — `/free-music/[city]` (`lib/city-guides.ts`) and `/free-live-music/[city]` (`lib/city-guides-data.ts`) — same H1, different canonicals, two corpora to keep accurate.
- **Series entity is split and self-destructing.** `/series/[city]/[series]` exists but **404s at season end** (`.gte('date', today)` + `notFound()`), and `sitemap.ts` submits the same entity as `/artist/…`. Authority is split across two URLs, then destroyed annually — the opposite of a durable asset.
- **~20% placeholder pollution.** ~312 of 1,600 future events are TBA/placeholder events (`is_tbd = true` or artist starts with "TBA"), each an indexable `/concert/` page. `is_tbd` never triggers noindex. [verified against DB July 18]
- **JSON-LD is misrepresentative.** `lib/jsonld.ts` hardcodes `organizer: 'Free Live Music'` (false — FLM doesn't organize these events), omits `streetAddress`/geo despite a 7,509-row venues table holding both, and lacks timezone offsets on `startDate`.

### Cost / reads
- **Per-request DB reads.** `middleware.ts` (matcher `/concert/:slug*`) hits Supabase on every request to decide on a 410 — DB reads scale with bot traffic — though the date is parseable from the slug.
- **Over-fetch + clock-based ISR.** `getConcerts()` does `select('*')` on all ~1,600 future rows; hourly ISR + hourly sitemap regeneration (re-reading all concerts + 7,509 venues) drove the documented 424K/200K ISR-write overage. Homepage also refetches `/api/concerts` on city switch — a second, uncrawlable data path.

### Data correctness
- **Daily timezone bug on indexable pages.** `lib/timezone.ts` has a correct IANA map but is imported only by the 4 noindex pages. Meanwhile the UTC "today" pattern `new Date().toISOString().split('T')[0]` appears in **26 files** — including `lib/data.ts`, `/concerts/[city]`, `/concert/[slug]`, `sitemap.ts`, and the past-events cron. [verified against repo July 18] Effect: **from ~5pm Pacific, tonight's West Coast shows vanish from every indexable page**, and the past-events cron archives West Coast events while they're still happening.
- **Duplicate + mislabeled events.** OC importers (`costa-mesa.ts`, `dana-point.ts`, `oc-parks.ts`, `oc-cities.ts`) hardcode `city:'LA'`, re-creating events the manual batch inserted as `ANA` → duplicate cards (dedupe is by `id` only) and wrong geography (Dana Point ≠ LA).
- **Schema hygiene.** `time` is text (1,345 twelve-hour, 121 24-hour, 134 null), no timezone. `city` is free-text resolved through a 3-way manual sync (`metros.json` / `types` union / `city-slugs`). Redundant indexes (`source_dedup` == `source_uniq`; `slug_key` + `slug_idx`; a too-strict `source_id_key`). `is_verified` meaningless (100% true). `event_series` table exists with **0 rows**. `venues.music_schedule` null on **all 7,509 rows**.

### Security (from advisors)
- Anon-callable `SECURITY DEFINER` RPCs (`rls_auto_enable`, `increment_event_views`); unlimited anon INSERT on `event_submissions` / `event_reports` (spam vector); RLS enabled with zero policies on `sources`, `city_year_sequences`.

### Maintenance drag / cut candidates
- Zombie crons (`seo-daily`, `gsc-pull`) failing daily for ~60 days, still burning Fluid CPU.
- `qa_flags`: 221 open `field_mismatch` + 12 `source_gone` with no consumer surface.
- Venue system: 0 clicks ever + `music_schedule` 100% null → freeze enrichment.
- `lib/affiliate.ts` (Awin/Booking) — premature monetization on ~25 lifetime clicks.
- `/intl/*` + `lib/feature-flags.ts` — gating for unpublished international metros.
- `CLAUDE.md` is stale (says 829 events; it's 3,926; lists shipped features as "planned"). For an AI-steered solo project, doc drift compounds into wrong decisions.

---

## The strategic decision (owner's call)

Everything below hinges on one choice: **stay a national-breadth SEO directory, or pivot to depth.**

**Fable's strong recommendation (three passes, converging):** Stop treating this as an SEO-led national directory. Rebuild around **3 year-round cities** (Vegas first, then Nashville, then NYC/Austin/New Orleans) with a **recurring-residency dataset** (populate the empty `music_schedule`), a **weekly newsletter** (no email capture exists today), and a **subreddit presence** as the primary channel for months 0–12. SEO becomes the byproduct of perennial residency pages + organizer backlinks, not the bet. Keep the 177-metro tail live as ambient surface area but stop investing in it.

**Why depth:** perennial inventory kills the September cliff; residency data is a real moat (scarce, year-round, expensive to fake, doesn't expire); every proven demand signal is depth-shaped (Vegas, named series, named artists); owned channels compound faster than a new domain's authority.

**The honest counter-argument:** the demand read rests on ~6 weeks of GSC data from a brand-new domain. That's thin. The lowest-regret path is to **prove the pivot on one city (Vegas) before betting the roadmap on it.**

---

## Prioritized roadmap

### Tier 0 — This week (correctness + trust; do regardless of strategy)
1. **Fix the timezone bug** — route all "today" logic through `lib/timezone.ts`; replace the 38 UTC usages. Cheapest correctness win; stops hiding West Coast evening inventory daily.
2. **Fix or kill the broken SEO gauges** — repair `gsc-pull`/`seo-daily` credentials and add failure-streak alerting (alert after 3 consecutive fails). Can't steer blind.
3. **Revoke anon-callable `rls_auto_enable`**; add rate-limiting / RLS policies to anon INSERT tables.
4. **Stop the fall data drought** — run the Apify/Eventbrite scrape for Sep–Dec now; audit top-25 sources for fall/2027 lineups; add a weekly "runway" query (events per city in the next 90 days).

### Tier 1 — Next 2 weeks (cost + duplication; low-risk, near-free wins)
5. **Middleware:** parse date from slug; drop the per-request DB call.
6. **Event-driven revalidation:** `revalidateTag('city:X')` from the import cron for changed cities only; lengthen clock-based ISR. Kills the ISR overage.
7. **Consolidate the series entity:** make `/series` render past seasons instead of 404ing; 301 the `/artist` series URL into it; put it in the sitemap; **noindex the ~312 TBA/placeholder event pages** with canonical → series.
8. **Kill duplicate guides:** 301 `/free-music/*` → `/free-live-music/*`; keep one corpus; **fact-check it** (it contains hallucinated venue claims — E-E-A-T poison).
9. **Slim reads:** select only card columns; remove the `/api/concerts` client refetch (navigate to the canonical city URL).
10. **Harden JSON-LD:** real `streetAddress`+geo from the venues table, TZ offsets, honest `organizer`. Free amplifier for Google's events module (which is markup-fed, not authority-gated).
11. Centralize the index/noindex threshold in one module imported by both sitemap and page metadata.
12. Fix the OC duplicate/mislabeled events (content-level dedupe key; correct OC city codes).

### Tier 2 — The strategic bet (only after the owner picks a direction)
13. **Pilot depth on Vegas:** build the Fremont Street importer (year-round, high demand); model recurring residencies (populate `music_schedule`); ship a Vegas residency page that never expires.
14. **Stand up the newsletter:** add email capture (absent today); weekly "free shows this weekend in {city}"; start with Vegas + 1–2 cities.
15. **Subreddit presence:** weekly posts in r/vegas etc. — works from day one, seeds organic links.
16. **Cut sources to ~30–50** feed-based + year-round; do not build a generic crawler (breadth doesn't convert).
17. Measure for ~one month, then decide whether to extend depth to Nashville / NYC.

### Tier 3 — Maintainability / deliberate rebuild (later)
18. Schema: `cities` table as a first-class entity with **`country` (ISO 3166 alpha-2) and `timezone` (IANA) as required columns from day one — not US-assumed**; `starts_at timestamptz`, `status` enum replacing the boolean soup, index cleanup, promote `sources` to the pipeline's source of truth.

    **International: capable, not committed.** Making the model country-aware is nearly free (the timezone fix already forces per-location IANA tz) and avoids a painful migration if a future deep market is international (the next pilot city could be London or Toronto as easily as Nashville). But: do NOT invest in international content, sources, or routes until the US depth pilot proves the residency/newsletter playbook. The existing `/intl/[country]/[city]/concerts` route is this idea started prematurely — design the capability into the *data*, not a half-built route family. Adding countries now is just more breadth, which is the thing the audit showed produces ~0 clicks.
19. Clean separation if/when rebuilding: `apps/web` (rendering, never imports scrapers) · `apps/ingest` (crawlers) · `packages/core` (shared types + normalize/dedup pipeline).
20. Freeze venue enrichment; shelve `affiliate.ts`; retire `/intl` + feature flags until justified.
21. Rewrite `CLAUDE.md` to match reality.

---

## Recommended path

Do **Tier 0 + Tier 1 now** — they're correctness, cost, and SEO-hygiene wins that pay off under any strategy and are individually small. In parallel, run **Vegas as the Tier 2 depth pilot** to get real signal on the pivot before committing the roadmap to it (this directly de-risks Fable's biggest uncertainty — that the demand data is thin). Treat the full national-breadth investment as paused, not killed, pending what the pilot + a repaired GSC feed show.

## What only shipping can answer (stop auditing on these)
- Does the events module surface the site after the JSON-LD fix?
- Does GSC traffic recover once instrumentation is repaired?
- Does a Vegas residency page actually rank?

These cost a month of execution, not another audit.
