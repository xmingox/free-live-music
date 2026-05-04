# Free Live Music — Project Summary

**Status:** ✅ LIVE & OPERATIONAL  
**Production:** https://www.freelivemusic.co  
**Repo:** https://github.com/xmingox/free-live-music  
**Stack:** Next.js 14+ | TypeScript | Supabase | Vercel

---

## Quick Reference

| Item | Details |
|------|---------|
| **Current Focus** | Event submissions + moderation system |
| **City Pages** | 186 pre-generated (ISR: 1-hour revalidation) |
| **Moderation URL** | `/moderation` (password: `flm-mod-2026`) |
| **DB Tables** | `concerts`, `event_submissions`, `city_year_sequences` |
| **Active Cities** | 173+ indexed; 10 cities with dedicated codes |
| **GA4 ID** | `G-HE4QED3BWS` |

---

## Workflow: Event Submission → Approval → Live

```
1. User submits URL + email via homepage
2. You approve at /moderation (with city dropdown override)
3. System extracts event details → saves to concerts table
4. Page revalidates within 1 hour (ISR) → event live
```

---

## Key Files

```
app/moderation/page.tsx                    ← Dashboard UI
app/api/moderation/approve/route.ts        ← Approval + city mapping
lib/extract-event-details.ts               ← Event parsing
lib/city-slugs.ts                          ← City utilities
lib/metros.json                            ← All US metros
types/index.ts                             ← Type definitions
supabase/schema.sql                        ← Database schema
```

---

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| Event not on city page | Wait 1 hour for ISR, or `git push` to deploy |
| Event went to NYC instead of correct city | Re-submit + manually select city in moderation |
| Extraction shows "Venue TBD" | Event URL missing structured data; manually pick city |
| Form validation error | Ensure only URL + Email are required fields |

---

## For Next Session

→ See `DETAILED_NOTES.md` for full session history & accomplishments  
→ See `CLAUDE_WORKFLOW.md` for token-efficient ways to work with Claude  
→ See `DATABASE.md` for schema & common queries

