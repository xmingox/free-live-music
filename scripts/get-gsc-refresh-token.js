#!/usr/bin/env node
/**
 * get-gsc-refresh-token.js — mint a fresh GOOGLE_REFRESH_TOKEN for the
 * /api/analytics/gsc cron after an `invalid_grant` failure.
 *
 * EASIEST USAGE — pass the OAuth client JSON you downloaded from Google Cloud
 * (Clients → flm-gsc (Desktop) → Download):
 *
 *   cd ~/Documents/MyProjects/free-live-music
 *   node scripts/get-gsc-refresh-token.js ~/Downloads/client_secret_XXXX.json
 *
 * (No need to copy the client id/secret by hand — it reads them from the file.)
 *
 * Alternatively, pass them as env vars:
 *   GOOGLE_CLIENT_ID="…" GOOGLE_CLIENT_SECRET="…" node scripts/get-gsc-refresh-token.js
 *
 * It opens a Google URL; sign in as the Search Console property owner and click
 * Allow (Advanced → "Go to (app) (unsafe)" if the unverified screen appears).
 * The new refresh token is printed AND written to a file OUTSIDE the repo.
 *
 * Prereqs: run from repo root (uses the installed `googleapis` dep); the OAuth
 * consent screen should be "In production" so the token doesn't expire in 7 days.
 */

const http = require('http')
const fs = require('fs')
const os = require('os')
const path = require('path')
const { google } = require('googleapis')

// --- Resolve client credentials: from a downloaded JSON file, or from env ---
let CLIENT_ID = process.env.GOOGLE_CLIENT_ID
let CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET

const arg = process.argv[2]
if (arg) {
  try {
    const p = arg.startsWith('~') ? path.join(os.homedir(), arg.slice(1)) : arg
    const raw = JSON.parse(fs.readFileSync(p, 'utf8'))
    const creds = raw.installed || raw.web || raw // Desktop clients use `installed`
    CLIENT_ID = creds.client_id || CLIENT_ID
    CLIENT_SECRET = creds.client_secret || CLIENT_SECRET
    console.log(`Loaded client credentials from ${p}`)
  } catch (e) {
    console.error(`❌ Could not read/parse the JSON file at "${arg}": ${e.message}`)
    process.exit(1)
  }
}

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('❌ No client credentials. Pass the downloaded JSON file path as the')
  console.error('   first argument, or set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.')
  process.exit(1)
}

const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
const PORT = Number(process.env.OAUTH_PORT || 4571) // change if the port is busy
const REDIRECT = `http://localhost:${PORT}`
const OUT_FILE = path.join(os.tmpdir(), 'gsc-refresh-token.txt') // OUTSIDE the repo — never committed

const oauth2 = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT)
const authUrl = oauth2.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // force a refresh_token even if previously granted
  scope: [SCOPE],
})

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, REDIRECT)
    const err = url.searchParams.get('error')
    const code = url.searchParams.get('code')
    if (err) {
      res.end(`Auth error: ${err}. Check the terminal.`)
      console.error(`\n❌ Google returned: ${err}`)
      server.close(); return
    }
    if (!code) { res.statusCode = 400; res.end('No ?code in redirect.'); return }

    const { tokens } = await oauth2.getToken(code)
    res.end('✅ Success — you can close this tab and return to the terminal.')

    if (tokens.refresh_token) {
      fs.writeFileSync(OUT_FILE, tokens.refresh_token, { mode: 0o600 })
      console.log('\n════════════════════════════════════════════════════════')
      console.log('✅ NEW GOOGLE_REFRESH_TOKEN')
      console.log('════════════════════════════════════════════════════════')
      console.log(tokens.refresh_token)
      console.log('════════════════════════════════════════════════════════')
      console.log(`(also saved to: ${OUT_FILE})`)
      console.log('\nNext: paste this into Vercel → Settings → Environment Variables')
      console.log('as GOOGLE_REFRESH_TOKEN (Production), then redeploy.\n')
    } else {
      console.error('\n⚠️  No refresh_token returned. Revoke prior access at')
      console.error('   https://myaccount.google.com/permissions and re-run.')
    }
  } catch (e) {
    console.error('\n❌ Token exchange failed:', e.message)
  } finally {
    server.close()
  }
})

server.listen(PORT, () => {
  console.log('\n1) Open this URL and approve as the Search Console property owner:\n')
  console.log('   ' + authUrl + '\n')
  console.log(`2) Waiting for Google to redirect back to ${REDIRECT} …`)
})
