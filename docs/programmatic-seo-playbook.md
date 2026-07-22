# The Programmatic-SEO Machine — a portable playbook

> **Site-agnostic.** This document is the distilled, reusable methodology behind freelivemusic.co. It is written to be **copied into a NEW site's repo** (e.g. as `docs/programmatic-seo-playbook.md`, linked from that repo's `CLAUDE.md`) and used to bootstrap the same machine in a different niche. Nothing below depends on the music niche.
>
> Provenance: extracted 2026-07-21 from ~2 months of build/measure cycles on freelivemusic.co (FLM). Where a claim comes from measured FLM data, it says so.

---

## 0. The core thesis

The asset is not the data or the content. **The asset is the machine:**

```
data import  →  programmatic pages  →  self-audit  →  GSC feedback loop
      ↑                                                      │
      └──────────── decisions driven by query data ←─────────┘
                 (all wrapped in an honesty discipline)
```

A machine like this, once proven, is worth 5–20x more per visitor pointed at a commercial-intent niche than at an informational one. FLM's free-music traffic monetizes at ~$5–12 RPM with ~0 purchase intent; home-services cost data runs $25–50+ RPM. Same work, different niche, order-of-magnitude different output. **When starting a new site, niche selection is the highest-leverage decision — make it before writing any code.**

## 1. Niche selection — the one criterion that matters

> **Find queries where searchers want STRUCTURED DATA and today's #1 result serves a bad page shape.**

That's how FLM's one proven winner was found (municipal concert series: searchers want "the 2026 schedule as a table"; incumbents serve a press release or a PDF). The gap is *page shape*, not content volume — you win by serving the data in the shape the query implies (a table, a schedule, a filterable list) when incumbents serve prose.

**Checklist for a candidate niche:**
- [ ] Queries decompose into an entity grid (thing × place, thing × year, thing × category) → programmatic page generation works.
- [ ] The underlying data is public, legally aggregatable, and refreshable by script (official calendars/registries/filings — not scraped private platforms).
- [ ] Current #1 results have bad page shape (PDFs, press releases, bloated listicles, JS-walled portals).
- [ ] Commercial or transactional intent exists → RPM. Good hunting grounds: civic & public-records data (auctions, permits, unclaimed funds), recreation/travel logistics (permits, seasonal access, fees), home-services cost data.
- [ ] NOT YMYL finance/health — ranking there is a war you can't win passively.
- [ ] Entities RECUR (yearly seasons, annual filings, renewal cycles) → pages compound instead of expiring. Durable recurring-entity pages beat ephemeral item pages (FLM: series/artist pages earned clicks; one-off event pages and giant directories earned ~0).
- [ ] Passes the **absent-owner test** (see §2).

## 2. Operating constraints (design for these from day one)

**Absent-owner test:** every feature must run with zero recurring human labor. If it needs weekly attention, cut it or automate it. (This killed: newsletters, media-brand plays, manual curation commitments.)

**Zero-cost stack:** Vercel Hobby + Supabase free tier + free-tier everything. Consequences:
- No per-request DB reads that scale with traffic (reads scale with imports, not visitors).
- Watch ISR write counts — use event-driven `revalidateTag` on import, not aggressive timers.
- **Vercel Hobby prohibits commercial use** — you cannot run ads/affiliate on Hobby. Monetization requires the Pro upgrade first (see §6 — don't upgrade before the traffic justifies it).
- No paid APIs without an explicit cost estimate and a deliberate decision (FLM took a silent $1.28 Google Places charge from a forgotten cron; assume that risk is real).

**Compliance-minimal:** no email collection (CAN-SPAM/GDPR exposure fails the absent-owner test), no accounts, no user data.

## 3. The machine, component by component

### 3.1 Data ingestion
- Importers per source, run by a **daily cron**. Prefer structured feeds (iCal, JSON, official APIs) over HTML scraping; scrapers rot.
- **Dedup by content key** (e.g. `entity+place+date`), never by row id — re-imports must not create duplicates.
- **Provenance rule:** only source facts from the authority's own *current-cycle* page. Never year-shift last cycle's data and present it as current. Mark placeholders explicitly (`is_tbd`) and noindex them.
- Static hand-entered data is fine to seed, but label it — it expires silently.

### 3.2 Programmatic pages
- One canonical host, one canonical URL family per entity. URL sprawl (two paths to the same content) is the most common self-inflicted wound.
- Build **entity pages that recur** (the series/season/registry page that's relevant every year) as the durable tier; item pages (single event/listing) are the disposable tier below them.
- Slugs should **embed the machine-readable key** (e.g. the ISO date): middleware can then make lifecycle decisions (410, noindex) by parsing the URL — zero DB reads.
- Truthful JSON-LD only: real addresses, real organizers, real dates. Fabricated structured data poisons trust.
- Centralize the index/noindex threshold in ONE module imported by both the sitemap and page metadata — otherwise they drift.

### 3.3 Honesty discipline (this is a ranking strategy, not ethics garnish)
- **410-Gone** for expired/removed items.
- **noindex** for: past items, TBA/placeholder pages, date-volatile pages (`/tonight`-style), and any thin directory tier that isn't earning clicks.
- **No fake freshness.** Never claim "Updated daily" unless a machine actually updates it daily. FLM had ~51 false claims; removing them was a prune, not a loss.
- **ISR-cache trap (learned the hard way):** a page cached while *current* keeps serving stale indexable HTML after it expires. Set lifecycle headers (`X-Robots-Tag: noindex`) **per-request in middleware** — headers stay correct even when the cached body is stale. Fast path: parse state from the slug; DB fallback only when needed.
- Middleware `X-Robots-Tag` is also the cheap way to noindex an entire URL family at once.

### 3.4 Self-audit
- A daily **seo-audit cron** that checks the invariants above (indexability vs. sitemap parity, canonical host, expired-but-indexable pages, false-freshness claims) and logs red on real issues.
- Teach the audit about every *intentional* noindex/prune, or it cries wolf and gets ignored.
- Add a **supply/runway monitor**: rows per entity-group over the next N days, alert on cliffs. Programmatic sites die quietly of empty pages.

### 3.5 GSC feedback loop
- **Use a service account, never user OAuth**, for the Search Console API. User refresh tokens expire (`invalid_grant`) and the pipeline dies silently — FLM lost 2 months of data this way. Setup:
  1. Create a GCP service account; download the JSON key; store it ONLY in the host's env vars (e.g. `GOOGLE_SERVICE_ACCOUNT_JSON` = the full JSON blob).
  2. In GSC (as the property owner): Settings → Users and permissions → add the service account's email as a user (Full). For URL-Inspection API access it must be a verified *owner*.
  3. For a domain property, the API site URL is **`sc-domain:example.com`** — not a URL-prefix form. (These three steps are the exact three bugs FLM hit; check env var *names* character-by-character.)
- Daily cron pulls query/page metrics into a `search_metrics` table. Include a **resumable backfill mode** (`?start=&end=`, ~14-day chunks) so outages are repairable. GSC data lags ~2–3 days.
- **Decisions come from this table:** what earns clicks gets depth; what earns zero for 6 weeks gets pruned/noindexed. FLM's pivotal finding — city hubs and a 7,509-page directory earned ~0 clicks; a handful of recurring-entity pages earned everything — was only visible here.
- Weekly readout for the owner: a short generated summary, read-only.

### 3.6 Free productization (build-once distribution)
- ICS/calendar feeds or data downloads per entity group ("subscribe" without email).
- An embeddable widget per entity group — every embed is an autopilot backlink.
- LLM-answer legibility: stable URLs, complete schema.org markup, visible "last verified" dates — AI answer engines are a growing referrer that reads structure.

## 4. Bootstrap checklist for a new site

1. Pick the niche with §1's checklist. Validate by hand-checking ~20 real queries' current #1 page shapes.
2. Stand up the stack: Next.js + Supabase free + Vercel Hobby. Copy this file into `docs/`; create a `CLAUDE.md` that links to it and records constraints (§2) as hard rules.
3. Model entities country/timezone-aware from day one; slugs embed the machine key.
4. Build ONE importer for the best structured source; daily cron; content-key dedup.
5. Build the durable-entity page template with truthful JSON-LD; sitemap + centralized index threshold.
6. Middleware lifecycle: 410 expired, per-request noindex on stale, slug-parsed fast path.
7. seo-audit cron + runway monitor.
8. GSC: verify domain property, service-account pull (§3.5), backfill mode, weekly readout.
9. Only then: widen sources, add entity groups where GSC shows clicks.
10. Write every architectural decision into `CLAUDE.md` the same session it's made — for an AI-steered project, that file IS the org chart.

## 5. Anti-patterns (each cost FLM real time or money)

- Breadth before depth: 177 metros / 7,509 venue pages earned ~0; the depth pages earned everything.
- Per-request DB reads scaling with traffic (free-tier killer).
- UTC for "today" in a local-time domain — hides evening items from West-Coast users.
- Hardcoded wrong keys in importers (an importer stamping the wrong city on events).
- Silent paid-API calls from forgotten crons.
- User-OAuth for machine pipelines (token expiry = silent data outage).
- Fake freshness claims; stale-cache indexability (§3.3).
- New URL families for existing content.
- Anything that fails the absent-owner test.

## 6. Monetization ladder (in order — don't skip steps)

1. **$0 stage:** stay on Hobby, zero monetization (Hobby bans commercial use anyway). Build traffic. Do NOT bolt on affiliate links at trivial traffic — realized revenue ~$0 and it creates a compliance problem (FLM ran this experiment; it was removed).
2. **Display-ad tripwire:** when sustained sessions hit **~2,500–5,000/mo** (watch seasonal dips before calling it sustained), flip to Vercel Pro (~$20/mo) + a low-barrier ad network (e.g. Journey by Mediavine, ~70% rev share, ~$11 RPM baseline; commercial niches much higher). Below the tripwire, ads lose money vs. the Pro cost.
3. **Affiliate** only where the niche has genuine purchase intent aligned with the page's job — otherwise skip.
4. **Exit:** content sites sell at **~20–40x monthly profit** (Flippa/Empire Flippers range). Pre-revenue sites are pocket change; ~6 months of $300–500/mo on a self-maintaining asset ≈ $9–18k exit. Selling the machine's output while keeping the machine is the compounding play.

---

*Companion docs in the FLM repo (not needed by a new site): `docs/session-log-2026-07-21.md` (worked example of the GSC repair), `docs/next-steps.md` (FLM-specific ranked backlog). A skill-format version of this playbook is scaffolded at `docs/skills/programmatic-seo-machine/SKILL.md` — see that file for cross-project install notes.*
