# Owner Action Checklist — things only you can do (outside Claude)

> Rewritten 2026-07-21. Most of the original list is now DONE. This is the current, short version.

## Resolved (July 21)
- **Google Search Console reconnected + backfilled.** The ~2-month data outage is fixed. The daily pull now runs as a **service account** (`flm-gsc-reader@freelivemusic.iam.gserviceaccount.com`), which never expires — so the old refresh-token / `invalid_grant` failure class is gone for good, regardless of which Google account (xmingox vs laferrtrust) you're signed into. `search_metrics` is now continuous from May 19 through yesterday.
- **The SEO prune shipped.** `/traditions` is linked and indexable; the entire `/venues/*` directory is noindexed and removed from the sitemap; the false "Updated daily" claims are gone; the self-audit no longer counts the removed venue pages.
- **Cron cap: non-issue.** Vercel Hobby allows well beyond your usage (all 13 crons in `vercel.json` run) — an earlier note here wrongly claimed a 2-cron cap.

## Open — do these
1. **Affiliate: pick one (2 min) — REQUIRED to honor the no-cost/Hobby stance.** `BOOKING_AFFILIATE_ID` *is* set in Vercel prod, so the Booking.com hotel links currently render as live Awin affiliate links (publisher 2888987, `rel="sponsored"`) — i.e. active commercial use, which Hobby's terms prohibit. Realized revenue is ~$0 at current traffic. To stay no-cost and compliant: **delete `BOOKING_AFFILIATE_ID` from Vercel env vars and redeploy** — the hotel links stay on the pages as plain (un-monetized) Booking.com links. (Alternative: keep earning and upgrade to Pro ~$20/mo. Either is fine; leaving it as-is is the worst of both.)
2. **Request indexing (2 min, in GSC).** URL Inspection -> paste `https://www.freelivemusic.co/traditions` -> Request Indexing. Same for `https://www.freelivemusic.co/free-live-music/new-york`. Then Sitemaps -> resubmit `sitemap.xml`.
3. **Bing Webmaster Tools (10 min, optional).** Add the site; Bing feeds DuckDuckGo and some AI answer surfaces. The repo already pings IndexNow.
4. **Back up the residency data (15 min, optional but wise).** The hand-verified `event_series` rows are the most irreplaceable thing in the product; Supabase free tier has no restore-worthy backups. Ask Claude for a `pg_dump` script, or enable Supabase paid backups.

## Decisions already made
- **Stay on Vercel Hobby (no cost).** (See item 1 — the affiliate env var is the one thing still inconsistent with this.)
- **Passive SEO only.** No email/newsletter (avoids CAN-SPAM / GDPR exposure while you're hands-off). Reddit optional.

## What Claude handles on its own
- Daily/weekly SEO audits (`seo-daily`), the supply "runway" monitor, and a short **weekly GSC readout** you can just read on check-in.
- Next growth move (per the GSC data): upgrading the `/artist/` municipal-series pages toward the "{series} 2026 schedule" queries they already rank 6-12 for. Claude can do this autonomously in one session.
