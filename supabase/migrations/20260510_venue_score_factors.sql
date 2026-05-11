-- Add score_factors, business_status, and status_checked_at to venues.
-- Run in Supabase SQL Editor → New Query → paste → Run.

ALTER TABLE venues
  ADD COLUMN IF NOT EXISTS score_factors     jsonb,
  ADD COLUMN IF NOT EXISTS business_status   text,
  ADD COLUMN IF NOT EXISTS status_checked_at timestamptz;

COMMENT ON COLUMN venues.score_factors     IS 'Breakdown of how music_score was computed by the venue-health cron';
COMMENT ON COLUMN venues.business_status   IS 'Cached Google Places businessStatus: OPERATIONAL | CLOSED_TEMPORARILY | CLOSED_PERMANENTLY';
COMMENT ON COLUMN venues.status_checked_at IS 'When business_status was last fetched from Google Places';
