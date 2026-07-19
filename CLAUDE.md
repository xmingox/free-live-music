# freelivemusic.co — Project Context & Guardrails for Claude
> Last updated: July 18, 2026. This file is auto-loaded every session. Keep it accurate — for an AI-steered project, this doc IS part of the architecture. Stale context causes wrong decisions.
> Full diagnosis + roadmap lives in `AUDIT_AND_PLAN.md`. Prior session history is archived in `CLAUDE_ARCHIVE.md`.

---

## 0. How Claude should operate on this project (read first)

**No guessing. Label confidence.**
- If you don't know something, say so and go find out (read the code, query the DB, search the web). Do not fill gaps with plausible-sounding invention.
- Suggesting is welcome — but when a claim isn't directly verified, mark it: **[verified]** (checked against code/DB/web just now), **[likely]** (strong inference, not confirmed), or **[guess]** (low confidence, needs checking). Never present a [guess] as fact.
- Prefer "I haven't confirmed this" over a confident wrong answer. A wrong number in this file or a deploy compounds.

**Verify before you trust — including this file.**
- Docs (including this one) can be stale. Before acting on a "fact," confirm it against the live code or database. Example precedent: the previous CLAUDE.md claimed 829 events; the real count was 3,926.
- When an audit or agent hands you a finding, spot-check the load-bearing claims yourself before building on them.

**Show your work before side effects.**
- Read-only audit first, then propose, then change. Show diffs before committing. Never deploy without the user seeing what ships.

**Verify both sides of every change.**
- After a permission/RLS change, confirm BOTH that the blocked role is denied AND that every legitimate role/route still has the access it needs. Precedent: a `REVOKE EXECUTE … FROM public` on a function silently stripped `service_role` and broke `/api/report` + `/api/track` — the restriction was verified, the still-works side was not. **Never `REVOKE … FROM public` on a function without re-granting the roles that need it** (esp. `service_role`).
- After any DB DDL, re-run `get_advisors` and spot-check with `has_table_privilege` / `has_function_privilege`.
- `bash deploy.sh` runs `tsc --noEmit` as a preflight gate — but that only catches type errors, not logic/permission/caching regressions. For security-sensitive, DB, or multi-file changes, run an independent review (a subagent) before calling it done.
- Caching/ISR changes: confirm which surfaces are actually tag-covered (`unstable_cache` with `tags`) vs. rely on the time-based backstop — `revalidateTag` only refreshes the former.

**Keep this file current.** When you change architecture, costs, or invariants, update the relevant section here in the same session.

---

## 1. What this is & the goal

A web app that helps people find **free** live music events near them across the US. Aggregates events from parks calendars, concert series, festivals, and venue feeds. Core dataset: events (concerts), venues, cities.

- **Live site:** https://www.freelivemusic.co · **Repo:** github.com/xmingox/free-live-music · **Branch:** main

**Priorities, in order:** (1) SEO discoverability, (2) crawl freshness — surface current/upcoming events, never stale/past, (3) fast + cheap reads that stay on free/near-free tiers, (4) long-term maintainability.

### Strategic direction (decided July 2026 — don't drift back)
The site is **pivoting from national breadth toward depth**. Evidence: across ~6 weeks of Search Console data, city hubs and the 7,509-venue directory earned ~0 clicks; every measured click came from individual event/artist pages. Demand concentrates in named series+year, named artists playing free shows, and a few year-round markets (Las Vegas foremost).

**Current bet:** pilot depth on **Las Vegas** (Fremont Street — free, nightly, year-round, weak incumbents) using a **recurring-residency data model** (the perennial inventory that kills the September supply cliff), plus **owned channels** (a weekly newsletter — none exists yet — and a subreddit presence) as the primary acquisition channel for the first 6–12 months. SEO is the harvest channel, not the seed. Keep the 177-metro tail live but stop investing in it until the pilot shows signal. See `AUDIT_AND_PLAN.md`.

**International: capable, not committed.** US-only today. Build the data model country-aware (ISO `country` + IANA `timezone` on cities/venues/events, which the timezone fix requires anyway) so a future deep market could be international — but invest in no non-US content, sources, or routes until the US pilot proves the playbook. Adding countries now is just more breadth. Don't extend the premature `/intl/*` route.

---

## 2. Spending guardrails (HARD RULES)

**Golden rule: never incur a paid API call or enable a billable service without (a) an explicit cost estimate and (b) the user's approval in chat.** Cost overruns on this project have happened silently before — assume that risk is real.

| Service | Plan / free limit | Rules & lessons learned |
|---|---|---|
| **Supabase** | Free tier | Stay on it. **No per-request runtime DB reads that scale with traffic** (the `middleware.ts` per-`/concert/` lookup is the anti-pattern — reads should scale with imports, not visitors). No paid add-ons without approval. |
| **Vercel** | Hobby (confirmed July 18) | **Currently OVER free limits (July 18 dashboard): ISR Writes 383K/200K (~1.9x) and Fluid Active CPU 7h47m/4h (~1.9x).** The June revalidate tuning did NOT fix ISR writes — needs event-driven `revalidateTag`, not blind timers. Fluid CPU is likely the daily crons (incl. the zombie `seo-daily`/`gsc-pull` still failing daily). Sustained Hobby overage can pause/throttle the project. ⚠️ **Hobby prohibits commercial use** — `lib/affiliate.ts` exists; if affiliate revenue is live, migration risk. |
| **Google Cloud (Places + Geocoding)** | — | **KEEP DISABLED.** A silent $1.28 Places charge already occurred (venue-health cron, now deleted). The manual scripts `discover-venues.mjs`, `enrich-venues.mjs`, `enrich-neighborhoods.mjs` call these APIs and **cost money** — run only on explicit request, re-enable the API deliberately, disable again after. Set a budget alert. |
| **Mapbox** | 50k loads/month free | Fine at current scale. Don't add map calls to high-traffic pages without checking the counter. |
| **Apify** (Eventbrite scrape) | ~$0.001/result | Batch runs only. Estimate cost (results × rate) and get approval before a large run. |
| **Resend** (email) | Free tier | Used for ops alerts today; the planned newsletter will need a volume check against the free limit before launch. |

**Before any billable action, state:** which service, estimated cost, and why. Then wait for a yes.

---

## 3. Correctness invariants (these keep breaking — respect them)

- **Timezone: never use UTC for "today."** Do not write `new Date().toISOString().split('T')[0]` for date logic — it hides West Coast evening shows from ~5pm Pacific. Use `lib/timezone.ts` (venue/city-local, IANA-aware). This pattern currently appears in ~26 files; new code must not add to them.
- **Time display:** 12-hour format ("7:30pm"), never "19:30". (Longer term: store a real `timestamptz` + venue tz.)
- **Adding a city requires a 3-way sync** — miss one and events silently don't render:
  1. Metro entry in `lib/metros.json` (3-letter code present in the `aliases` array, not just `code`)
  2. City code in the `City`/`Concert.city` unions in `types/index.ts`
  3. Slug handling in `lib/city-slugs.ts`
  Verify on `/concerts/{city-slug}` (direct query, no ISR delay).
- **Dedup by content, not just `id`.** Duplicate cards have appeared because importers re-created events under a different city code (OC importers hardcoding `city:'LA'` for `ANA` events). Use an `artist+venue+date` key. **Never hardcode the wrong city in an importer** — Dana Point ≠ LA.
- **Data provenance:** source event dates from the venue's/organizer's **own current-year page**, never year-adjusted from a prior-year "best of summer" article. Set `is_tbd = true` for placeholder/unnamed performers.
- **`price` is always "Free."** `date` must be >= today (frontend filters past). `is_verified = true` for manual adds (note: currently 100% true, so it no longer discriminates).

---

## 4. SEO principles

- **One canonical host:** `https://www.freelivemusic.co` everywhere (a www/non-www mismatch previously caused deindexing).
- **One canonical URL family per entity.** Do not create new URL surfaces for the same content. Known sprawl to consolidate, not extend: `/free-music/*` (duplicate of `/free-live-music/*`), plus overlapping city/time/state families.
- **Series & artist pages are the durable assets** — they recur yearly and match real search demand. They must NOT 404 at season end (the current `/series` page does — fix to show past seasons). Pick one of `/series` vs `/artist` for a given entity and 301 the other.
- **noindex discipline:** TBA/placeholder events (~310 currently indexable — should be noindexed with canonical → series), past events, and date-volatile pages (`/tonight`, `/this-week`, `/this-weekend`).
- **JSON-LD must be truthful.** `lib/jsonld.ts` currently hardcodes `organizer: 'Free Live Music'` on events it doesn't organize — that's misrepresentation. Include real `streetAddress`+geo (available in the `venues` table) and timezone offsets.
- **Centralize the index/noindex threshold** in one module imported by both `sitemap.ts` and page metadata (they currently drift).
- Keep the good hygiene already in place: 410-Gone for expired events, `previous_slug` 301s, archive sweep, noindex on volatile pages.

---

## 5. Architecture reference (current, verified July 2026)

**Stack:** Next.js 15.5.x (App Router, TypeScript), React 19, Tailwind (dark theme). Supabase (Postgres 17). Vercel (project `free-live-music-1lwp`). Mapbox GL JS.

**Data (live counts):** `concerts` 3,926 rows (1,600 future, ~2,326 past — past events are NOT being cleaned from the main table despite `is_archived`). `venues` 7,509 (`music_schedule` null on all of them). `event_series` exists with 0 rows. Future supply by month: Jul 537 / Aug 827 / Sep 174 / Oct 39 / Nov 11 / Dec 12 — **the September cliff is real and ~6 weeks out.**

**Ingestion:** ~55 importers in `lib/importers/`; only ~5 are live scrapers (SummerStage iCal is the model), the rest are hardcoded static arrays that expire. A daily cron (`/api/import`, 6am UTC) runs them. The generic Brave+Haiku extractor is effectively dead (10 submissions ever).

**Key files:** `lib/data.ts` (queries; currently `select('*')` — over-fetches), `middleware.ts` (per-request 410 check — should parse date from slug), `app/sitemap.ts`, `lib/timezone.ts`, `lib/jsonld.ts`, `lib/metros.json`, `lib/city-slugs.ts`.

**Schema note:** `concerts.time` is text (mixed formats), no timezone. `city` is free-text. Redundant indexes exist on source-dedup and slug. See `AUDIT_AND_PLAN.md` for the cleanup list.

---

## 6. Deployment

Git push to `main` → Vercel auto-deploys via GitHub webhook (~2–3 min). Data-only refresh: `git commit --allow-empty -m "bust ISR" && git push`.

**Deploy helper:** run `bash deploy.sh "commit message"` — it commits all changes and pushes to `main` (Vercel auto-deploys).

**Git auth (RESOLVED July 18):** `gh` CLI is now authenticated as `xmingox` with `gh auth setup-git`, so a plain `git push origin main` works. (History: it was previously logged in as `evenaisle`, causing 403s.) **Never paste a PAT into chat.**

Secrets live in `.env.local` (Supabase URL/keys, Mapbox token) — never commit them, never print their values.

---

## 7. Do-NOT list

- ❌ Don't add per-request DB reads that scale with traffic.
- ❌ Don't call Google Places/Geocoding without re-enabling deliberately + disabling after + user approval.
- ❌ Don't create new URL families for existing content.
- ❌ Don't hardcode a city code in an importer that doesn't match the event's real location.
- ❌ Don't use UTC for "today."
- ❌ Don't write unverified facts into guides/JSON-LD (fabricated venue claims poison E-E-A-T).
- ❌ Don't force-push or rebase published commits.
- ❌ Don't incur billable API usage without a cost estimate + approval.
- ❌ Don't present guesses as facts — label confidence.

---

## 8. Status & priorities (updated July 20)

See `AUDIT_AND_PLAN.md` for the full tiered roadmap.

**Shipped / applied July 20:**
- **Las Vegas residency dataset — the pivot's first published, indexable artifact.** The formerly-empty `event_series` table is now the live residency model: added provenance (`source_url`, `last_verified_at`, `confidence` A/B/C) + `internal_notes` (editorial state, kept OUT of the render-path `description`); widened `recurrence_type` to allow `daily`; replaced `day_of_week int` with `days_of_week text[]`; RLS tightened to **`USING (is_active=true)`** so unverified drafts are structurally unleakable via the anon key; dedup guard on `series_name`. Nine Vegas candidates were hand-researched and staged `is_active=false`; only **Fremont Street Experience 1st & 3rd Street stages** cleared the primary-source bar (official site, modified 2026-07-03) and were flipped `is_active=true`. Container Park and RUSH Lounge correctly *failed* verification (their own pages don't confirm a free music residency) and stayed drafts. New `lib/residencies.ts` + a "Free live music every night in {city}" section on `/concerts/[city]` renders active residencies **as schedules, never synthetic dated rows** (hard rule — also protects the runway monitor, which reads `concerts` only). A city with ≥1 published residency is now **indexable** even off-season (durable content is not the dated-event cliff). EventSeries + `Schedule` JSON-LD puts recurrence in markup without fabricating instances. Vegas page verified live + `index`. Candidate list + one-action-per-row verification checklist: `docs/vegas-residency-candidates.md`.
- **Honesty + calibration fixes** (from an independent Fable code review): dropped the "typically returns in {Month}" prediction — all concert data is a single year, so it was an unfounded guess; now factual "last hosted {Month Year}". Unified the indexability predicate so metadata (DB filter) and body (JS predicate) cannot disagree on `null is_verified`. Runway `tail_thin` now warns on a week-over-week drop instead of an always-true absolute floor. Explicit UTC parse in the middleware fast path.
- **Process:** every change this session was checked by a Fable subagent, which caught a real fabrication ("The Mantis" is Container Park's fire sculpture, not a band), a draft-leak via the anon RLS policy, and editorial notes leaking into render-path copy — all fixed pre-ship.

**Shipped / applied July 19:**
- **Middleware per-request DB read removed from the hot path** (`middleware.ts`, Tier 1 #5). Slugs end with the event date (`…-nyc-2026-07-19`) and that trailing date is a verified-exact proxy for the row's `date` (0 mismatches in the DB). The middleware now parses it first: any event not 7+ days past passes straight through with **no Supabase read**. The DB read only runs for slugs encoding a 7+‑day‑past date or with no date (legacy ~356 rows) — where the lookup is still needed to distinguish a real 410 from a `previous_slug` of a still-active concert (page 301s it). Reads now scale with stale-URL crawls, not live traffic.
- **Empty-page protection on `/concerts/[city]`** (graceful degradation for the autumn cliff). New `lib/city-fallback.ts`: when a city is sparse, renders recurring-series *history* (grouped by artist+venue, 3+ occurrences) with a data-supported "typically returns in {Month}" for dormant series, top venues, and nearest cities that have upcoming events (venue-centroid haversine — every venue is geocoded, no API cost). All fallback queries go through `unstable_cache` (daily backstop + `tags:['concerts']`) so reads scale with imports, not traffic.
- **Centralized the noindex threshold** in `lib/city-visibility.ts` (`CITY_MIN_UPCOMING = 10` + `isIndexableUpcoming`/`countIndexable`). Both the city-page metadata and `sitemap.ts` import it, ending the drift where they disagreed (metadata counted `is_verified` only; sitemap counted `is_verified && !is_tbd`). Metadata now counts over metro+alias codes with `is_verified && !is_tbd && !is_cancelled`, matching what the body renders.
- **Fixed a latent bug:** empty cities were returning `MOCK_CONCERTS` (fabricated cards on a real page — violated the "no unverified events" invariant and hid the empty state). Now a genuinely empty city returns `[]`; mock is dev-only (missing env).
- **Weekly runway monitor** — new `lib/runway.ts` + `GET /api/maintenance/runway` (Mondays 14:00 UTC in `vercel.json`). Measures events/city over the next 90d + the 60–90d tail, diffs against the prior run in the new **`runway_runs`** table, and alerts via `sendCronAlert` when a previously-covered city (≥3 in 90d) drops below 3, or 90-day supply falls >20% WoW. Mirrors to `cron_runs` for the daily digest. First run has no baseline → no alerts until the second Monday (expected).
  - `runway_runs` grants were **verified both sides** (§0): the table did NOT inherit `service_role` INSERT on creation — granted explicitly to match `seo_daily_runs` (service_role writes, anon/authenticated read-only). Without this the cron would have silently failed to write.
- ⚠️ **Deploy caveat (July 19):** this session's cloud sandbox **cannot `git push`** (no git identity in the mount, `.git` object writes denied, GitHub egress blocked by proxy 403). The migration was applied live via MCP, but the *code* push must be run from the owner's macOS terminal: `bash deploy.sh "…"`. Verify after deploy that `/api/maintenance/runway` registered as the 13th Vercel cron (Hobby may cap cron count — unverified).

**Shipped / applied July 18:**
- **Event-driven revalidation** to cut the ISR-write overage (was 383K/200K): hourly→daily timers on data-driven pages + `revalidateTag('concerts')` from the import cron. Caveat: only `getConcerts`-backed surfaces (homepage, `/api/concerts`) are tag-refreshed; other pages rely on the 24h backstop. `/tonight`, `/this-week`, `/this-weekend` kept hourly (date-volatile).
- **Timezone fix:** all "today" boundary logic routes through `getUsToday()` (Pacific-lenient) in `lib/timezone.ts`; ~23 UTC usages replaced.
- **Security:** revoked anon-callable `rls_auto_enable`; closed anon INSERT on `event_submissions`/`event_reports`; locked `increment_event_views` to server; dropped inert permissive write policies on 6 ops tables; pinned function search_paths. (Regression caught + fixed by independent review: a `REVOKE … FROM public` had stripped `service_role` and broken `/api/report` + `/api/track` — see §0.)
- **Deploy:** `deploy.sh` added with a `tsc --noEmit` preflight gate; `gh` auth fixed as `xmingox`.

**Cron status:** `gsc-pull` has failed on `invalid_grant` since **May 18** (~2 months of no Search Console data; expired Google OAuth) — **owner must re-authenticate Google**; still open as of July 20. `seo-daily` is NOT broken — it's a working audit that logs a red run whenever it finds a real SEO issue (currently: past events missing noindex meta + a few canonical issues — flagged for a later pass).

**September cliff decision:** protect empty city pages (graceful degradation) + start Vegas/year-round sourcing; do NOT spend on Apify scrapes (breadth + partly a seasonal demand trough). Add weekly runway monitoring. Data: Sep 174 / Oct 39 / Nov+ 23 events; only 22 metros have Oct+ content.

**Next up:**
- **Re-authenticate Google** (restore `gsc-pull`) — still dark since **May 18**; blocks all demand measurement. Owner action, ~5 min.
- **Vercel Pro, or drop `affiliate.ts`** — Hobby was ~1.9× over ISR/CPU and prohibits commercial use while affiliate links are live; a suspension at the wrong moment is the risk. Owner action.
- **Extend Vegas depth:** add the Fremont **Main Street stage** (verified by the same official source — 2→3 for free); resolve **RUSH Lounge**'s free/no-cover status (first non-Fremont venue, fixes the "two cards, one venue" look); build an activation flow that calls `revalidateTag('residencies')` when flipping `is_active`. Then decide on city #2.
- **Email capture** — still absent. Fable's "single worst omission": peak season with no way to keep the audience. A day of work.
- **Tier 1 hygiene:** consolidate `/free-music`→`/free-live-music` + `/series` vs `/artist` URLs (also unblocks the show-page series idea), noindex the ~312 TBA pages, harden JSON-LD, slim `select('*')`.
- Fold the residency + graceful-degradation sections into the alias city pages (`/concerts/city/[alias]`) — this pass covered `/concerts/[city]` only.
- **Presentation:** group multi-stage venues (the two Fremont cards) into one venue-family card.
- **Series on the show page (future iteration).** Surface "Part of {series}" + `superEvent` JSON-LD on `/concert/[slug]` to flow crawl authority from show pages (where the clicks land) into the durable series asset. **Blocked on Tier 1 first:** the series entity must be made evergreen (`/series/[city]/[series]` currently 404s off-season) and one canonical URL chosen between `/series` and `/artist` (301 the other) — else this just deepens the URL split. Also settle the series *definition* (artist-repeat vs named venue/program series like SummerStage — the latter is likely higher-demand but isn't modeled; `event_series` is empty). Detection logic already exists in `lib/city-fallback.ts` to reuse once unblocked.
- **Tier 2:** Las Vegas depth — ~~residency data model~~ (shipped July 20; `event_series` live with 2 verified Fremont residencies); remaining: Fremont *dated-event* importer, newsletter + subreddit, more verified residencies.
