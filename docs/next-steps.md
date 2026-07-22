# Next steps — freelivemusic.co (parked 2026-07-21)

**State:** Everything from the July 21 session is shipped + verified. GSC reconnected via service account + historical backfill run (search_metrics continuous May 19 -> Jul 20). SEO prune live (/traditions linked; /venues/* noindexed + out of sitemap; false "Updated daily" removed). Past-event ISR-cache noindex bug fixed. Affiliate de-monetized (BOOKING_AFFILIATE_ID removed; hotel links now plain, clearing from ISR cache within ~24h). The site is a healthy, zero-cost, self-tending passive asset. Nothing below is urgent.

## The strategic conclusion (the important part)
The valuable asset isn't the concert data — it's the **machine**: daily import -> programmatic pages -> self-audit -> GSC feedback loop -> honesty discipline (410s, noindex, no fake freshness). Free-music traffic monetizes near the bottom of the barrel (~$5-12 RPM, ~0 purchase intent). The same machine pointed at a commercial-intent, data-shaped niche is worth 5-20x per visitor. **Since a new site is coming next, the highest-EV move is to aim this proven engine at a better niche.**

**Niche-selection criterion (the playbook the machine taught us):** find queries where searchers want structured data AND today's #1 result serves them a bad page shape. (Exactly how the municipal-concerts cluster was found.) Prefer commercial-intent / higher-RPM niches: civic & public-records data (auctions, permits, unclaimed funds), recreation/travel logistics (permits, seasonal access), home-services cost data ($25-50+ RPM). Avoid YMYL finance/health (ranking is a war).

**The full, portable, site-agnostic methodology — machine architecture, niche checklist, bootstrap steps, monetization ladder — is `docs/programmatic-seo-playbook.md`. Copy that file into the next site's repo to bootstrap it.** The July 21 implementation details (GSC service-account repair, ISR noindex fix) are in `docs/session-log-2026-07-21.md`.

## FLM next steps, ranked (all optional)
1. **Municipal-series page upgrade** (highest-leverage FLM move; Claude can do in one session). `/artist/[slug]` pages already group municipal series but rank pos ~10 at ~0% CTR because they're single-date "TBA—" pages. Fix: strip "TBA—" from titles; retitle to "{Series} 2026 Schedule — Free Concerts at {Venue}, {City}"; render the FULL season (past dates marked played + upcoming), keep expired-page noindex; make the concert->series link a prominent "Full {series} 2026 schedule" block; add EventSeries/ItemList JSON-LD; link series from city listing pages. Targets ~600 impr/mo where the site already ranks 6-12. Control proof: "Shaggy in Central Park" cluster at pos 5-7 converts ~5%. Summer-seasonal — July work pays through Sept and catches "{series} 2027" next spring.
2. **Free productization (build-once, zero ongoing labor):** per-city/tradition ICS calendar feeds ("subscribe to free concerts in {city}" — a no-email newsletter substitute); an embeddable "free live music this week in {city}" widget (each embed = autopilot backlink); LLM-answer legibility (stable URLs, Event schema, "last verified" dates).
3. **Duplicate-slug cleanup (~20 pages):** legacy venue+month-day slugs (e.g. `-bryant-park-aug29`) duplicate the canonical city+ISO slugs (`-nyc-2026-08-29`). Make legacy slugs 301 to canonical via `previous_slug`. Hygiene, not a leak — Google already collapses them.
4. **Ads tripwire (don't act until crossed):** when the weekly GSC readout shows sustained ~2,500-5,000 sessions/mo, flip to Vercel Pro (~$20/mo) + Journey by Mediavine (~70% rev share, ~$11 RPM). Below that line, ads lose money vs the Pro cost. Watch the winter (post-summer-series) dip.
5. **Traditions flagship (one-time):** turn the 43 hand-verified residencies into one definitive, press-pitchable, linkable page with an annual refresh — cheapest link-authority play, raises the whole domain. NOT an ongoing media-brand commitment (fails the absent-owner test).
6. **Sell only after it earns:** content sites go ~20-40x monthly profit. Pre-revenue = pocket change. After ~6 months at $300-500/mo -> ~$9-18k exit on a self-maintaining asset.

## Owner tasks (GSC / Vercel, when convenient)
- Request indexing for /traditions + /free-live-music/new-york; resubmit sitemap.xml.
- Back up the `event_series` table (pg_dump) — the 43 rows are the irreplaceable asset.
- (Optional) make the service account a verified *owner* in GSC so the URL-Inspection API check stops throwing invalid_grant.

## Skip (fail the absent-owner / no-cost / no-compliance tests)
Paid data API/licensing; affiliate at current traffic; any email newsletter; "become a media brand."
