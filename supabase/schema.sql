-- Free Live Music — Supabase schema v3
-- Updated: May 2026
-- Run against a fresh Supabase project to recreate the full schema.
-- Live project: rxdutrcjkmfhonzpsthb (us-west-2)

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─────────────────────────────────────────────────────────────────────────────
-- Functions
-- ─────────────────────────────────────────────────────────────────────────────

-- Converts arbitrary text to a URL-safe slug segment.
CREATE OR REPLACE FUNCTION slugify(t TEXT)
RETURNS TEXT LANGUAGE SQL IMMUTABLE STRICT AS $$
  SELECT TRIM(BOTH '-' FROM
    REGEXP_REPLACE(
      LOWER(
        REGEXP_REPLACE(unaccent(t), '[^a-zA-Z0-9\s-]', '', 'g')
      ),
      '[\s-]+', '-', 'g'
    )
  );
$$;

-- Builds the base slug: {artist}-{venue_first_30_chars}-{mondd}
-- e.g. "samara-joy-bryant-park-lawn-apr28"
CREATE OR REPLACE FUNCTION concert_base_slug(
  p_artist TEXT,
  p_venue  TEXT,
  p_date   DATE
) RETURNS TEXT LANGUAGE SQL IMMUTABLE STRICT AS $$
  SELECT TRIM(BOTH '-' FROM
    slugify(p_artist)
    || '-' || LEFT(slugify(p_venue), 30)
    || '-' || LOWER(TO_CHAR(p_date, 'Mondd'))
  );
$$;

-- Appends -2, -3, … until the slug is unique within the concerts table.
CREATE OR REPLACE FUNCTION unique_concert_slug(
  p_artist TEXT,
  p_venue  TEXT,
  p_date   DATE,
  p_id     UUID DEFAULT NULL
) RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_base TEXT := concert_base_slug(p_artist, p_venue, p_date);
  v_slug TEXT := v_base;
  v_n    INT  := 2;
BEGIN
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM concerts
      WHERE slug = v_slug
        AND (p_id IS NULL OR id <> p_id)
    ) THEN
      RETURN v_slug;
    END IF;
    v_slug := v_base || '-' || v_n;
    v_n    := v_n + 1;
  END LOOP;
END;
$$;

-- Returns the next display_id string, e.g. "NYC-2026-000007"
-- Uses an atomic upsert so concurrent inserts never collide.
CREATE OR REPLACE FUNCTION next_concert_display_id(p_city TEXT, p_date DATE)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_code TEXT;
  v_year INT;
  v_seq  INT;
BEGIN
  v_code := CASE p_city
    WHEN 'NYC' THEN 'NYC'
    WHEN 'LA'  THEN 'LAX'
    ELSE UPPER(p_city)
  END;
  v_year := EXTRACT(YEAR FROM p_date)::INT;

  INSERT INTO city_year_sequences (city_code, year, last_val)
  VALUES (v_code, v_year, 1)
  ON CONFLICT (city_code, year)
  DO UPDATE SET last_val = city_year_sequences.last_val + 1
  RETURNING last_val INTO v_seq;

  RETURN v_code || '-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');
END;
$$;

-- Trigger body: auto-fills display_id and slug on insert.
CREATE OR REPLACE FUNCTION concerts_before_insert()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.display_id IS NULL THEN
    NEW.display_id := next_concert_display_id(NEW.city, NEW.date);
  END IF;
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := unique_concert_slug(NEW.artist_name, NEW.venue, NEW.date);
  END IF;
  RETURN NEW;
END;
$$;

-- Called by the concert detail page to count page views.
CREATE OR REPLACE FUNCTION increment_event_views(p_id UUID)
RETURNS VOID LANGUAGE SQL AS $$
  UPDATE concerts SET event_views = event_views + 1 WHERE id = p_id;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- city_year_sequences  (display_id counter per city + year)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE city_year_sequences (
  city_code TEXT    NOT NULL,
  year      INTEGER NOT NULL,
  last_val  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (city_code, year)
);

ALTER TABLE city_year_sequences ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- venues
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE venues (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug           TEXT NOT NULL UNIQUE,
  name           TEXT NOT NULL,

  venue_type     TEXT DEFAULT 'other'
    CHECK (venue_type IN (
      'park','amphitheater','plaza','bar','restaurant','brewery',
      'mall','coffee_shop','farmers_market','church','library',
      'school','museum','community_center','rooftop','other'
    )),
  indoor_outdoor TEXT DEFAULT 'outdoor'
    CHECK (indoor_outdoor IN ('indoor','outdoor','both')),

  address        TEXT,
  neighborhood   TEXT,
  city           TEXT NOT NULL,
  state          TEXT,
  zip            TEXT,
  lat            NUMERIC,
  lng            NUMERIC,

  website        TEXT,
  instagram      TEXT,
  phone          TEXT,
  description    TEXT,

  music_genres   TEXT[],
  music_frequency TEXT
    CHECK (music_frequency IN ('weekly','biweekly','monthly','seasonal','occasional')),
  music_schedule TEXT,

  is_21_plus     BOOLEAN DEFAULT false,
  is_verified    BOOLEAN DEFAULT false,
  is_partner     BOOLEAN DEFAULT false,
  partner_tier   TEXT CHECK (partner_tier IN ('basic','featured','premium')),

  google_place_id TEXT,
  submitted_by    TEXT,

  music_score     INTEGER,
  last_checked_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX venues_city_idx           ON venues (city);
CREATE INDEX venues_venue_type_idx     ON venues (venue_type);
CREATE INDEX venues_google_place_id_idx ON venues (google_place_id);

ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON venues FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- event_series  (recurring concert series linked to a venue)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE event_series (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  venue_id        UUID REFERENCES venues (id),
  series_name     TEXT NOT NULL,
  description     TEXT,
  default_artist  TEXT,
  default_genre   TEXT,
  default_price   TEXT DEFAULT 'Free',
  default_time    TEXT,
  recurrence_type TEXT CHECK (recurrence_type IN ('weekly','biweekly','monthly','annual','irregular')),
  day_of_week     INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  start_date      DATE,
  end_date        DATE,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX event_series_venue_id_idx ON event_series (venue_id);
CREATE INDEX event_series_active_idx   ON event_series (is_active);

ALTER TABLE event_series ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read" ON event_series FOR SELECT USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- concerts
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE concerts (
  -- Identity
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  display_id  TEXT UNIQUE,
  slug        TEXT NOT NULL UNIQUE,

  -- Core show details
  artist_name    TEXT NOT NULL,
  venue          TEXT NOT NULL,
  date           DATE NOT NULL,
  time           TEXT,
  neighborhood   TEXT NOT NULL,
  city           TEXT NOT NULL,
  genre          TEXT,
  price          TEXT NOT NULL DEFAULT 'Free',
  admission_type TEXT NOT NULL DEFAULT 'Walk-up free'
    CHECK (admission_type IN ('Walk-up free', 'Free RSVP')),

  -- Venue metadata
  indoor_outdoor TEXT CHECK (indoor_outdoor IN ('Indoor', 'Outdoor', 'Both')),
  image_url      TEXT,
  description    TEXT,

  -- Status flags
  is_verified  BOOLEAN NOT NULL DEFAULT false,
  is_tbd       BOOLEAN NOT NULL DEFAULT false,
  is_cancelled BOOLEAN DEFAULT false,
  is_archived  BOOLEAN DEFAULT false,

  -- Analytics
  event_views INTEGER NOT NULL DEFAULT 0,

  -- Relationships
  venue_id  UUID REFERENCES venues (id),
  series_id UUID REFERENCES event_series (id),

  -- Source / deduplication
  source_url  TEXT,
  source_name TEXT,
  source_id   TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplication: (source_name, source_id) must be unique when both are non-null.
CREATE UNIQUE INDEX concerts_source_dedup_idx
  ON concerts (source_name, source_id)
  WHERE source_name IS NOT NULL AND source_id IS NOT NULL;

-- Filtered indexes for common query patterns
CREATE INDEX concerts_city_date_idx     ON concerts (city, date);
CREATE INDEX concerts_slug_idx          ON concerts (slug);
CREATE INDEX concerts_venue_id_idx      ON concerts (venue_id);
CREATE INDEX concerts_series_id_idx     ON concerts (series_id);
CREATE INDEX concerts_active_idx        ON concerts (city, date) WHERE is_archived IS NOT TRUE;
CREATE INDEX concerts_archive_sweep_idx ON concerts (date) WHERE is_archived IS NULL OR is_archived = false;
CREATE INDEX idx_concerts_event_views   ON concerts (event_views DESC);

ALTER TABLE concerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read"         ON concerts FOR SELECT USING (true);
CREATE POLICY "Service role insert" ON concerts FOR INSERT WITH CHECK (true);

-- Trigger: auto-fills display_id and slug before insert
CREATE TRIGGER concerts_auto_fields
  BEFORE INSERT ON concerts
  FOR EACH ROW EXECUTE FUNCTION concerts_before_insert();

-- ─────────────────────────────────────────────────────────────────────────────
-- event_submissions  (user-submitted events pending curation)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE event_submissions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  source_name TEXT,
  submitter_email TEXT NOT NULL,
  submitted_city  TEXT,
  submitted_state TEXT,
  city_code       TEXT,

  -- Extracted fields populated by the import pipeline
  extracted_artist        TEXT,
  extracted_venue         TEXT,
  extracted_venue_address TEXT,
  extracted_date          DATE,
  extracted_time          TEXT,
  extracted_city          TEXT,
  extracted_state         TEXT,
  extracted_neighborhood  TEXT,
  extracted_genre         TEXT,
  extracted_admission_type TEXT,
  extracted_indoor_outdoor TEXT,
  extracted_image_url     TEXT,
  source_extractor        TEXT,

  -- Review workflow
  status           TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  review_notes     TEXT,
  reviewed_by      TEXT,
  reviewed_at      TIMESTAMP,
  auto_approve_eligible BOOLEAN DEFAULT false,

  -- Link to published concert (set after approval)
  concert_id  UUID,

  submitted_at TIMESTAMP DEFAULT now(),
  created_at   TIMESTAMP DEFAULT now(),
  published_at TIMESTAMPTZ
);

CREATE INDEX event_submissions_status_idx       ON event_submissions (status);
CREATE INDEX event_submissions_submitted_at_idx ON event_submissions (submitted_at DESC);
CREATE INDEX event_submissions_extractor_idx    ON event_submissions (source_extractor)
  WHERE source_extractor IS NOT NULL;
CREATE INDEX idx_event_submissions_email        ON event_submissions (submitter_email);

ALTER TABLE event_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit"      ON event_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public read"            ON event_submissions FOR SELECT USING (true);
CREATE POLICY "Service role full access" ON event_submissions FOR ALL USING (true) WITH CHECK (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- metro_crawl_log  (tracks which cities have been crawled and when)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE metro_crawl_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metro_code   TEXT NOT NULL,
  metro_name   TEXT NOT NULL,
  state        TEXT,
  population   INTEGER,
  crawled_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  events_found INTEGER DEFAULT 0,
  events_added INTEGER DEFAULT 0,
  result       TEXT,
  notes        TEXT,
  revisit_after  DATE,
  revisit_reason TEXT
);

CREATE INDEX idx_metro_crawl_log_code ON metro_crawl_log (metro_code);

ALTER TABLE metro_crawl_log ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- sources  (tracks validated source URLs for the import pipeline)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE sources (
  url            TEXT PRIMARY KEY,
  source_name    TEXT,
  last_validated DATE,
  year_confirmed INTEGER,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sources ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- cron_runs  (audit log for all scheduled maintenance jobs)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE cron_runs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at   TIMESTAMPTZ,
  success       BOOLEAN,
  stats_json    JSONB,
  error_message TEXT
);

CREATE INDEX cron_runs_name_idx ON cron_runs (name, started_at DESC);

ALTER TABLE cron_runs ENABLE ROW LEVEL SECURITY;

-- ─────────────────────────────────────────────────────────────────────────────
-- crawl_suppressions  (blocks the import pipeline from re-ingesting bad URLs)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE crawl_suppressions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pattern     TEXT NOT NULL,
  match_field TEXT NOT NULL DEFAULT 'any'
    CHECK (match_field IN ('artist_name','venue','source_name','source_url','any')),
  match_type  TEXT NOT NULL DEFAULT 'contains'
    CHECK (match_type IN ('contains','exact','starts_with')),
  reason      TEXT NOT NULL,
  added_by    TEXT NOT NULL DEFAULT 'manual',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crawl_suppressions_pattern ON crawl_suppressions (lower(pattern));

ALTER TABLE crawl_suppressions ENABLE ROW LEVEL SECURITY;
