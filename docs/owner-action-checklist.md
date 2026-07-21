# Owner Action Checklist — things only you can do (outside Claude)

> Compiled 2026-07-20. Ordered by priority. 🔴 = blocking the pivot · 🟡 = do soon · 🟢 = optional.

---

## 🔴 1. Re-authenticate Google Search Console — ~15 min

**Why:** `gsc-pull` has failed with `invalid_grant` every day since **May 18** — that's ~2 months with no search data, so we're flying blind on whether anything ranks (including the new Vegas page).

**Root cause (important):** the ~7-day failure cycle is the classic signature of an OAuth app still in **"Testing"** publishing status — Google **expires those refresh tokens every 7 days**. So a new token alone will die again next week. You must do BOTH parts.

> **Best permanent option (optional, recommended):** a **service account** removes this entire failure class — no consent screen, no refresh tokens, nothing to expire. Ask Claude to switch the `gsc-pull` cron to service-account auth (~15-min code change); you'd create a service account in Google Cloud, add its email as a **user on the Search Console property**, and drop the JSON key into a Vercel env var. If you'd rather not touch code today, use the OAuth path below — just know it's the one that broke.

### Part A — Permanent fix: publish the consent screen to Production
1. Go to **Google Cloud Console** → the project that owns the GSC OAuth credentials.
2. **APIs & Services → OAuth consent screen.**
3. If "Publishing status" is **Testing**, click **PUBLISH APP** → confirm. (Moves to "In production." `webmasters.readonly` is a *sensitive* scope, so Google **verification is not required** for a private single-user app — ignore the verification prompt.)
   - Result: refresh tokens stop expiring after 7 days.
4. **Sequencing matters:** mint the new token (Part B) **only after** this flips to Production. A token minted while still in Testing keeps the 7-day expiry — publishing doesn't retroactively fix an already-issued token.
5. **Expect the scary screen:** because the app is unverified, the consent flow will show "Google hasn't verified this app." Click **Advanced → Go to (app name) (unsafe)** and continue. That's normal for a private app, not a problem.

### Part B — Generate a fresh refresh token
**Recommended — use the helper script** (ask Claude to add `scripts/get-gsc-refresh-token.js` to the repo, then):
```bash
cd ~/Documents/MyProjects/free-live-music
GOOGLE_CLIENT_ID="<your id>" GOOGLE_CLIENT_SECRET="<your secret>" node scripts/get-gsc-refresh-token.js
```
It opens a Google URL → sign in as the **GSC property owner** → approve the read-only Search Console scope → it prints your new `GOOGLE_REFRESH_TOKEN`.

*(Your existing `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` are already in the Vercel env vars — copy them from there. The client is an OAuth "Desktop app," so the script's localhost redirect works without extra config.)*

### Part C — Update Vercel and redeploy
1. **Vercel → project `free-live-music-1lwp` → Settings → Environment Variables.**
2. Edit **`GOOGLE_REFRESH_TOKEN`** → paste the new value → Save (apply to Production).
3. **Deployments → latest → ⋯ → Redeploy** (or just wait for the next daily cron at 12:00 UTC).

### Verify it worked
The next day, tell Claude "check gsc-pull" — it'll confirm `cron_runs` shows `success: true` and `search_metrics` has a fresh date.

---

## 🔴 2. Vercel plan / commercial-use decision — ~5 min

**Why:** the project was ~**1.9× over** Hobby's ISR-write + Fluid-CPU limits, and **Hobby prohibits commercial use** while the affiliate module (`lib/affiliate.ts`) is live. That's a suspension risk at the worst possible time.

**This is effectively already decided: upgrade to Pro.** Hobby caps cron jobs at **2**, and you're running `gsc-pull` + `seo-daily` + the new weekly `runway` (plus others) — so you're over the cron cap regardless of the ISR/CPU overage or the commercial-use issue. $20/mo is noise next to validating a business that's currently half-instrumented.
- **Upgrade to Pro:** Vercel → `free-live-music-1lwp` → **Settings → Billing → Upgrade**. Lifts usage limits + the cron cap, and makes commercial use allowed.
- (Only if you truly want to stay free: tell Claude to remove `lib/affiliate.ts` — but you'd still be over the cron cap, so some crons silently won't run.)

**While you're in Vercel:**
- **Confirm the runway cron registered:** Settings → **Cron Jobs** → look for `/api/maintenance/runway` (Mondays 14:00 UTC). If it's missing, that's the Hobby cron cap — Pro fixes it.
- **Usage tab:** glance at ISR Writes + Fluid CPU to confirm they dropped after the July revalidation fix.

---

## 🟡 3. Request indexing of the Vegas page — 2 min (after #1)

Once Search Console is back: **URL Inspection** → paste `https://www.freelivemusic.co/concerts/las-vegas` → **Request Indexing**. The page is now indexable (verified live), so this nudges Google to crawl it sooner — useful for the pivot test.

---

## 🟡 4. Confirm the Vegas JSON-LD — 1 min (optional)

Use the **schema.org validator** (https://validator.schema.org/) → enter the Vegas URL → confirm the `EventSeries` block parses. **Do NOT use Google's Rich Results Test for this** — Google has no rich-result support for `EventSeries`/`Schedule`, so it will report **"no items detected,"** which is *expected*, not a failure. (Don't try to "fix" that non-problem.) Claude can't see inline `<script>` tags via its web tools, so this is the one thing worth a human glance.

---

## 🟢 5. Spot-check the 2 verified residencies — optional

Claude verified **Fremont Street Experience 1st & 3rd Street stages** against the official `vegasexperience.com` site. If you know Vegas, a glance confirms they're right. The other 7 candidates are staged as unverified drafts (`is_active=false`) — see `docs/vegas-residency-candidates.md`.

---

---

## 🔴 6. Install first-party web analytics — TODAY, ~10 min

**This is the biggest gap on the whole list.** GSC only shows *Google search* traffic. The pivot's distribution plan (a weekly r/vegas post) drives **Reddit referral traffic that GSC cannot see at all** — you'd have no idea if anyone clicked, what they read, or whether they bounced. Installing analytics now also captures a **pre-Reddit baseline**, without which the day-45 scorecard can't attribute anything.
- Easiest: **Vercel Analytics** (Vercel → project → Analytics → Enable; Claude adds `@vercel/analytics` to the app — a 2-line code change). Or **Plausible** (privacy-friendly, ~$9/mo).
- Tell Claude which one and it wires it up.

## 🟡 7. Season a Reddit account — START TODAY (2–4 week lead time)

The weekly r/vegas post is step 4 of the strategy, but **a young/low-karma account posting a link gets auto-removed or mod-banned on the first try** — and you don't get a second first impression with mods. This has a lead time that gates the whole distribution arm, so start now:
- Read r/vegas (and r/LasVegas, r/vegaslocals) **self-promotion rules**.
- **Message the mods** describing the format ("a weekly free-live-music roundup, no paywall") and ask if it's welcome.
- Start **participating organically** (helpful comments) to build karma/age before the first post.

## 🟡 8. Set up a real backup of the residency data — ~15 min

The hand-verified `event_series` rows (sources, confidence grades, verification dates) are now the **most irreplaceable asset in the product** — one bad migration erases the pivot's inventory. Supabase free tier has no restore-worthy automatic backups. Either enable Supabase's paid backups, or set up a scheduled `pg_dump` (Claude can write the script).

## 🟡 9. Bing Webmaster Tools + IndexNow + resubmit sitemap — ~10 min

Bing feeds DuckDuckGo and several AI answer surfaces that matter for "free live music las vegas" queries. Add the site to **Bing Webmaster Tools**; the repo already has an IndexNow route, so confirm it's pinging. Once GSC is re-authed, **resubmit the sitemap** and confirm the newly-indexable city pages are in it.

## 🟢 10. Compliance (before the relevant thing ships)

- If `affiliate.ts` stays live: add an **FTC affiliate disclosure** on affected pages.
- Before email capture ships: a **privacy policy** covering it.
- Before sending any newsletter: pick a **sending subdomain** (e.g. `mail.freelivemusic.co`) and set SPF/DKIM/DMARC — but this can wait until you actually send.

---

## Decisions to hand back to Claude (then it builds)

- **Analytics:** Vercel Analytics (Claude wires it in ~2 lines) or Plausible?
- **GSC auth:** want Claude to switch the cron to a **service account** (kills the expiry bug for good), or stick with the OAuth refresh-token path above?
- **Email capture:** external provider (Mailchimp / Buttondown / ConvertKit) or the simplest path — store signups directly in Supabase, no third-party service?
- **Vercel:** upgraded to Pro, or should Claude remove `affiliate.ts`?
- **Next build focus:** email capture · deepen Vegas residencies · Tier-1 SEO hygiene (noindex TBA pages) · draft the r/vegas post.
