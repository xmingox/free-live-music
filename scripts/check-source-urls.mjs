/**
 * check-source-urls.mjs
 *
 * HEAD-checks all distinct source_url values across upcoming concerts.
 * Reports broken URLs (4xx/5xx/timeout) grouped by source_name.
 *
 * Usage:
 *   node scripts/check-source-urls.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '../.env.local')
try {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
    if (!process.env[key]) process.env[key] = val
  }
} catch {}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
)

const TODAY = new Date().toISOString().split('T')[0]
const BATCH = 10
const TIMEOUT_MS = 10_000

async function headCheck(url) {
  try {
    const res = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; freelivemusic-bot/1.0)' },
      redirect: 'follow',
    })
    return res.status
  } catch (e) {
    // Some servers reject HEAD — try GET with no body read
    try {
      const res = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(TIMEOUT_MS),
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; freelivemusic-bot/1.0)' },
        redirect: 'follow',
      })
      return res.status
    } catch {
      return 0 // timeout / DNS failure
    }
  }
}

async function main() {
  // Fetch all distinct source URLs from upcoming concerts
  const { data, error } = await supabase
    .from('concerts')
    .select('source_url, source_name')
    .gte('date', TODAY)
    .not('source_url', 'is', null)

  if (error) { console.error('DB error:', error.message); process.exit(1) }

  // Dedupe by URL, track source names and counts
  const urlMap = new Map()
  for (const row of data ?? []) {
    if (!row.source_url) continue
    if (!urlMap.has(row.source_url)) {
      urlMap.set(row.source_url, { source_name: row.source_name, count: 0 })
    }
    urlMap.get(row.source_url).count++
  }

  const urls = [...urlMap.entries()]
  console.log(`\nChecking ${urls.length} distinct source URLs...\n`)

  const broken = []
  const ok = []
  let checked = 0

  for (let i = 0; i < urls.length; i += BATCH) {
    const batch = urls.slice(i, i + BATCH)
    await Promise.all(batch.map(async ([url, meta]) => {
      const status = await headCheck(url)
      checked++
      if (status === 0 || status >= 400) {
        broken.push({ url, status, ...meta })
      } else {
        ok.push({ url, status, ...meta })
      }
    }))
    process.stdout.write(`\r  ${checked}/${urls.length} checked...`)
    if (i + BATCH < urls.length) await new Promise(r => setTimeout(r, 200))
  }

  console.log(`\n\n── Results ─────────────────────────────────────────`)
  console.log(`  OK:     ${ok.length}`)
  console.log(`  Broken: ${broken.length}`)

  if (broken.length === 0) {
    console.log('\n  All source URLs are reachable.')
    return
  }

  console.log('\n── Broken URLs ─────────────────────────────────────')
  broken.sort((a, b) => b.count - a.count)
  for (const b of broken) {
    const statusLabel = b.status === 0 ? 'TIMEOUT/DNS' : `HTTP ${b.status}`
    console.log(`\n  [${statusLabel}] ${b.source_name} (${b.count} concerts)`)
    console.log(`    ${b.url}`)
  }
  console.log('')
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
