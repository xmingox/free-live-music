#!/usr/bin/env bash
# Commit all current changes and deploy to production.
# Vercel auto-deploys when main is pushed.
#
# One-time setup (so pushes authenticate as xmingox):
#   gh auth login          # GitHub.com -> HTTPS -> web browser -> sign in as xmingox
#   gh auth switch --user xmingox   # only if evenaisle is also logged in
#   gh auth setup-git      # lets git use gh for credentials
#
# Usage:  bash deploy.sh "your commit message"
set -e

MSG="${1:-chore: update site}"

git add -A
git commit -m "$MSG" || echo "(nothing new to commit — pushing any existing commits)"
git push origin main

echo ""
echo "✅ Pushed to main. Vercel will build & deploy in ~2-3 min."
echo "   Watch it at: https://vercel.com  ->  free-live-music-1lwp  ->  Deployments"
