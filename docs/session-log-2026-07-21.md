# Session log — 2026-07-21

> Durable narrative of the July 21 session: what shipped, why, and exactly how — especially the GSC service-account repair, so it is **never re-derived**. Summary lives in `CLAUDE.md` §8; strategy/next moves in `docs/next-steps.md`; owner TODOs in `docs/owner-action-checklist.md`.

## Commits shipped this session

| Commit | What |
|---|---|
| `2a2d4b9` | SEO prune: /traditions surfaced, /venues/* noindexed, false freshness claims removed |
| `a804e9a` | GSC reconnect: service-account auth in `app/api/analytics/gsc/route.ts` |
| `257ee83` | GSC resumable backfill mode (`?start=&end=`, 14-day chunks) |
| `59771b7` | Past-event ISR-cache noindex fix in `middleware.ts` |

All deployed via `bash deploy.sh "msg"` from the owner's Mac (the only deploy path; Vercel auto-builds on push).

---

## 1. SEO prune (2a2d4b9)

**Why:** the 7,509-page `/venues/*` directory earned ~0 clicks over 6 weeks of GSC data while consuming crawl budget and diluting the site with thin pages; ~51 pages carried a false "Updated daily" claim (fake freshness is exactly the dishonesty the site's own audit exists to catch); `/traditions` (the 43 hand-verified residencies — the best content on the site) was orphaned.

**What:**
- `/traditions` linked from homepage, nav, and footer.
- Entire `/venues/*` surface noindexed via middleware `X-Robots-Tag: noindex` header (not per-page metadata — one rule, no drift) and removed from `app/sitemap.ts`.
- ~51 false "Updated daily" claims removed from templates.
- `seo-daily` audit updated so pruned venue pages don't count as issues: it now reports `venues_eligible: 0`.

**Principle preserved:** noindex-by-header via middleware is the pattern for killing a whole URL family without touching every page component, and the self-audit must be taught about intentional noindexes or it cries wolf.

---

## 2. GSC reconnected + backfilled (a804e9a, 257ee83) — READ THIS BEFORE EVER DEBUGGING GSC AGAIN

**Symptom:** `gsc-pull` cron failed daily with `invalid_grant` for ~2 months; `search_metrics` had a hole from late May onward. Original cause: the OAuth refresh token (user-grant flow) expired and could not be silently renewed.

**Fix chosen:** switch from user OAuth to a **Google Cloud service account**. Service-account keys never expire and are independent of which human Google account (xmingox vs laferrtrust) is signed in anywhere. This kills the entire `invalid_grant` failure class permanently.

### The three-bug stack (each masked the next — all three had to be fixed)

1. **Env var NAME mismatch.** The code read `GOOGLE_SERVICE_ACCOUNT_KEY`; the variable actually set in Vercel is **`GOOGLE_SERVICE_ACCOUNT_JSON`**. Auth silently fell through. Fix: code now reads `GOOGLE_SERVICE_ACCOUNT_JSON` (the full JSON key blob).
2. **Service account not a user on the GSC property.** Even with valid auth, the Search Console API returns permission errors unless the service account's email is added as a user on the property. Fix (done in GSC UI by the owner, signed in as `laferrtrust@gmail.com`, the property owner): Settings → Users and permissions → Add user → `flm-gsc-reader@freelivemusic.iam.gserviceaccount.com` (Full permission).
3. **Wrong `GSC_SITE_URL`.** The property is a **domain property**, so the site URL must be **`sc-domain:freelivemusic.co`** — not `https://www.freelivemusic.co/` or any URL-prefix form. Wrong form → property-not-found even when auth and permissions are right.

### Working configuration (current state)

- Service account: `flm-gsc-reader@freelivemusic.iam.gserviceaccount.com` (Google Cloud project under the freelivemusic GCP account; key JSON stored ONLY in Vercel env — never commit or print it).
- Vercel env: `GOOGLE_SERVICE_ACCOUNT_JSON` = full key JSON; `GSC_SITE_URL` = `sc-domain:freelivemusic.co`.
- `app/api/analytics/gsc/route.ts` authenticates via JWT with scope `https://www.googleapis.com/auth/webmasters.readonly` and runs daily by cron.
- GSC property owner: `laferrtrust@gmail.com`. Service account is a *user*, not a verified owner — which is why the URL-Inspection API check in seo-daily still throws `invalid_grant`; making it an owner is an optional owner task (see `docs/owner-action-checklist.md`).

### Backfill mode (257ee83)

`app/api/analytics/gsc/route.ts` accepts `?start=YYYY-MM-DD&end=YYYY-MM-DD` and walks the range in **14-day chunks**, resumable (re-running skips/overwrites idempotently), so a long outage can be repaired without timeouts. The backfill was run for the outage window: **`search_metrics` is now continuous May 19 → Jul 20**. If a future gap appears: hit the route with the gap's start/end. Note GSC data itself lags ~2-3 days.

---

## 3. Past-event ISR-cache noindex fix (59771b7)

**Bug shape (subtle — worth remembering):** concert pages are ISR-cached. A page cached while the event was *upcoming* keeps serving that stale, **indexable** HTML after the show passes, until the next revalidation. So recently-past events were indexable for up to a day+ — fake-fresh content, the exact class of dishonesty the prune targeted.

**Fix:** `middleware.ts` sets `X-Robots-Tag: noindex` **per-request** on recent past events, so the header is correct even when the cached body is stale. Two paths:
- **Fast path:** parse the event date straight from the slug (canonical slugs embed ISO dates) — no DB read.
- **DB path:** fallback lookup for slugs without a parseable date.

The `seo-daily` audit was updated to accept the header (not just meta-tag noindex) as satisfying the past-event noindex requirement. Older past events remain handled by the existing 410/archive sweep.

---

## 4. Affiliate de-monetized (owner action, no commit)

Owner deleted `BOOKING_AFFILIATE_ID` from Vercel env vars. Hotel links on city pages now render as plain, un-monetized Booking.com links (cleared from ISR cache within ~24h). This closes the Vercel-Hobby commercial-use compliance gap flagged in `CLAUDE.md` §2. Do not re-add monetization while on Hobby.

---

## 5. Operational facts pinned this session (also in CLAUDE.md — kept there as source of truth)

- Deploy = `bash deploy.sh "msg"` from the owner's Mac Terminal (typecheck → commit → push → Vercel auto-build).
- Vercel project `free-live-music-1lwp`, Hobby plan — Hobby allows all 13 crons in `vercel.json` (an old "2-cron cap" note was wrong).
- Recurring snag: stale `.git/index.lock` blocks commits; `rm -f .git/index.lock` fixes it.
- Supabase project `rxdutrcjkmfhonzpsthb`.
- Real inventory: ~1,500 upcoming concerts (NOT 10k), ~3,900 total.

## 6. Where the strategy landed

See `docs/next-steps.md` (written this session): the reusable programmatic-SEO *machine* is the real asset; the next site should point it at a higher-RPM, structured-data-shaped niche. The portable methodology is extracted into `docs/programmatic-seo-playbook.md` — copy that file into the next site's repo to bootstrap it.
