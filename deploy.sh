#!/usr/bin/env bash
# Commit all current changes and deploy to production.
# Vercel auto-deploys when main is pushed. Uses the xmingox credential workaround
# so the wrong local gh account (evenaisle) can't cause a 403.
#
# Usage:  bash deploy.sh "your commit message"
set -e

MSG="${1:-chore: update site}"

git add -A
git commit -m "$MSG"
git -c credential.helper= -c credential.https://github.com.helper= \
  push https://xmingox@github.com/xmingox/free-live-music.git main

echo ""
echo "✅ Pushed to main. Vercel will build & deploy in ~2-3 min."
echo "   Watch it at: https://vercel.com  →  free-live-music-1lwp  →  Deployments"
