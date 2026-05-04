# Terminal Quick Commands

---

## Build & Deploy

```bash
# Build locally (verify no errors before pushing)
npm run build

# Deploy to Vercel (triggers production build)
git push origin main

# Check build output
npm run build -- --verbose
```

---

## Database Queries (Supabase SQL Editor)

### Daily Checks
```sql
-- How many pending submissions?
SELECT COUNT(*) FROM event_submissions WHERE status = 'pending';

-- Latest 5 submissions
SELECT id, submitter_email, source_url, submitted_at 
FROM event_submissions 
WHERE status = 'pending' 
ORDER BY submitted_at DESC 
LIMIT 5;

-- Events added this week
SELECT COUNT(*) FROM concerts 
WHERE created_at > NOW() - INTERVAL '7 days';

-- Events per city (top 5)
SELECT city, COUNT(*) as count 
FROM concerts 
GROUP BY city 
ORDER BY count DESC 
LIMIT 5;
```

### Event Management
```sql
-- Find event by artist name
SELECT * FROM concerts 
WHERE artist_name ILIKE '%Howie%' 
LIMIT 10;

-- Find event by venue
SELECT artist_name, date, city FROM concerts 
WHERE venue = 'Musicians Corner' 
ORDER BY date DESC;

-- Delete test event
DELETE FROM concerts 
WHERE id = 12345;

-- Reassign event to different city (careful!)
UPDATE concerts 
SET city = 'AUS' 
WHERE artist_name = 'Some Artist';
```

### Submission Management
```sql
-- Approve pending submission (if extraction already done)
UPDATE event_submissions 
SET status = 'approved' 
WHERE id = 999;

-- Reject with reason
UPDATE event_submissions 
SET status = 'rejected', rejection_reason = 'Duplicate event' 
WHERE id = 999;

-- Check rejected submissions
SELECT id, source_url, rejection_reason, submitted_at 
FROM event_submissions 
WHERE status = 'rejected' 
ORDER BY submitted_at DESC;
```

---

## Development Workflow

```bash
# Start dev server
npm run dev
# Visit http://localhost:3000

# View moderation dashboard
# http://localhost:3000/moderation (password: flm-mod-2026)

# Check logs
npm run dev -- --verbose

# Run type check
npm run type-check

# Format code
npm run format
```

---

## Git Workflow

```bash
# Check current branch
git status

# Create a feature branch
git checkout -b feature/city-detection-improvement

# Commit changes
git add .
git commit -m "Improve city detection for AT&T PAC events"

# Push to GitHub
git push origin feature/city-detection-improvement

# Create PR on GitHub (via web)
# After review, merge to main

# Pull latest
git pull origin main

# Deploy by pushing main
git push origin main  # Vercel auto-deploys
```

---

## Environment Check

```bash
# Verify env variables loaded (don't echo keys!)
echo "Supabase URL configured: $NEXT_PUBLIC_SUPABASE_URL"
echo "Moderation password set: [REDACTED]"

# Check Vercel env (if using Vercel CLI)
vercel env list
vercel env pull  # Download .env.local from Vercel
```

---

## Performance & Debugging

```bash
# Check bundle size
npm run analyze
# (requires @next/bundle-analyzer)

# Profile build time
npm run build -- --profile

# Test API endpoint locally
curl -X GET http://localhost:3000/api/moderation/get-submissions

# Check ISR (should show revalidation log)
npm run dev
# Look for: "revalidating /concerts/[city]" in console
```

---

## VSCode Shortcuts (if using VSCode)

| Shortcut | Action |
|----------|--------|
| `Cmd+Shift+F` | Find across files (search codebase) |
| `Cmd+P` | Open file by name |
| `Cmd+G` | Go to line number |
| `Cmd+Shift+P` | Command palette |
| `Cmd+K Cmd+C` | Comment selection |
| `Cmd+L` | Select current line |

**Find city mapping logic:**
```
Cmd+Shift+F → "mapCityCode" → Enter
```

**Find event extraction:**
```
Cmd+Shift+F → "extractEventDetails" → Enter
```

---

## Database CLI (if installed locally)

```bash
# Initialize local Supabase (optional, for local development)
supabase start

# View database schema
supabase db pull

# Run migration
supabase migration new add_new_column

# Reset database (careful!)
supabase db reset
```

---

## Vercel CLI

```bash
# Login to Vercel
vercel login

# Deploy to preview
vercel --prod

# Check deployment logs
vercel logs

# Pull environment variables
vercel env pull .env.local
```

---

## One-Liners for Common Tasks

```bash
# Count pending submissions (if you have psql installed)
# psql $DATABASE_URL -c "SELECT COUNT(*) FROM event_submissions WHERE status = 'pending';"

# Find all files with "extractEventDetails"
grep -r "extractEventDetails" app/ lib/

# Find all TODO comments
grep -r "TODO" app/ lib/ | grep -v node_modules

# Check file size (API route size)
du -h app/api/moderation/approve/route.ts

# Format entire project (if Prettier configured)
npm run format

# Run linter
npm run lint

# Type check (catches TypeScript errors)
npm run type-check
```

---

## Emergency Rollback

```bash
# If deployment breaks:
git log --oneline  # See recent commits
git revert HEAD    # Revert last commit
git push origin main  # Redeploy (Vercel auto-triggers)
```

---

## Testing an Event URL Submission

```bash
# Test the extraction function locally
# Use Node REPL or add a test script:

node -e "
const url = 'https://attpac.org/event/flora-street-live';
const { extractEventDetails } = require('./lib/extract-event-details');
extractEventDetails(url).then(console.log);
"
```

---

**Quick Access:**
- Production: https://www.freelivemusic.co
- Moderation: https://www.freelivemusic.co/moderation (pwd: flm-mod-2026)
- GitHub: https://github.com/xmingox/free-live-music
- Supabase Dashboard: https://app.supabase.com

