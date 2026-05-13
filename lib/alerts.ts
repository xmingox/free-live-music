/**
 * Centralized alert helpers for cron failures and daily digest.
 *
 * Both functions are no-ops when RESEND_API_KEY is not set, so they are safe
 * to call from any cron handler without branching on env availability.
 */

import { Resend } from 'resend'

const FROM = 'alerts@freelivemusic.co'
const TO   = process.env.RESEND_TO_EMAIL ?? 'Xmingox@hotmail.com'

// Rate-limit: one alert per endpoint per hour (stored in module scope — resets on cold start,
// but that's fine since cold starts reset the dedupe window anyway).
const lastAlertAt: Record<string, number> = {}
const ALERT_COOLDOWN_MS = 60 * 60 * 1000

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  return key ? new Resend(key) : null
}

export async function sendCronAlert(endpoint: string, error: unknown): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const now = Date.now()
  if (lastAlertAt[endpoint] && now - lastAlertAt[endpoint] < ALERT_COOLDOWN_MS) return
  lastAlertAt[endpoint] = now

  const message = error instanceof Error ? error.message : String(error)

  try {
    await resend.emails.send({
      from: FROM,
      to: TO,
      subject: `[FLM] Cron failed: ${endpoint}`,
      text: `Cron endpoint ${endpoint} failed at ${new Date().toISOString()}.\n\nError:\n${message}`,
    })
  } catch (sendErr) {
    console.error('[alerts] sendCronAlert failed:', sendErr)
  }
}

export interface DigestCronRun {
  name: string
  started_at: string
  success: boolean
  error_message: string | null
  stats_json: Record<string, unknown> | null
}

export async function sendDailyDigest(runs: DigestCronRun[]): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  const failures = runs.filter(r => !r.success)
  const subject = failures.length > 0
    ? `[FLM] Daily digest ${date} — ${failures.length} failure(s)`
    : `[FLM] Daily digest ${date} — all crons OK`

  const lines = runs.map(r => {
    const status = r.success ? '✓' : '✗'
    // Exclude per_source from the inline stats — it gets its own section below
    const statsEntries = r.stats_json
      ? Object.entries(r.stats_json).filter(([k]) => k !== 'per_source')
      : []
    const stats = statsEntries.length > 0
      ? ' | ' + statsEntries.map(([k, v]) => `${k}: ${v}`).join(', ')
      : ''
    const err = r.error_message ? `\n    ERROR: ${r.error_message}` : ''
    return `${status} ${r.name.padEnd(24)} ${new Date(r.started_at).toISOString()}${stats}${err}`
  })

  // Per-source breakdown and threshold warnings from the import run
  const warnings: string[] = []
  const importRun = runs.find(r => r.name === 'import')
  if (importRun?.stats_json) {
    const perSource = importRun.stats_json.per_source as Record<string, number> | undefined
    if (perSource) {
      const zeroSources = Object.entries(perSource).filter(([, v]) => v === 0).map(([k]) => k)
      if (zeroSources.length > 0) {
        warnings.push(`⚠ Sources returning 0 rows (${zeroSources.length}): ${zeroSources.join(', ')}`)
      }
    }
    const suppressed = importRun.stats_json.suppressed as number | undefined
    if (typeof suppressed === 'number' && suppressed > 50) {
      warnings.push(`⚠ High suppression count: ${suppressed} rows suppressed (threshold: 50)`)
    }
  }

  const body = [
    `Daily cron summary — ${date}`,
    `${'─'.repeat(60)}`,
    ...lines,
    '',
    ...(warnings.length > 0 ? [...warnings, ''] : []),
    failures.length > 0
      ? `${failures.length} cron(s) failed. Review at https://www.freelivemusic.co/admin/health`
      : 'All crons completed successfully.',
  ].join('\n')

  try {
    await resend.emails.send({
      from: FROM,
      to: TO,
      subject,
      text: body,
    })
  } catch (sendErr) {
    console.error('[alerts] sendDailyDigest failed:', sendErr)
  }
}
