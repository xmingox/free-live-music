-- Free Live Music — Supabase schema v2
-- Run this in your Supabase SQL editor (Project → SQL Editor → New query)

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensions
-- ─────────────────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─────────────────────────────────────────────────────────────────────────────
-- City-year sequences  (powers the display_id counter per city + year)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE city_year_sequences (
  city_code TEXT    NOT NULL,
  year      INTEGER NOT NULL,
  last_val  INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (city_code, year)
);

-- Returns the next display_id string, e.g. "NYC-2026-000007"
-- Uses an atomic upsert so concurrent inserts never collide.
CREATE OR REPLACE FUNCTION next_concert_display_id(p_city TEXT, p_date DATE)
RETURNS TEXT LANGUAGE plpgsql AS $$
DECLARE
  v_code TEXT;
  v_year INT;
  v_seq  INT;
BEGIN
  -- Map internal city name → airport-style code
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Slug helpers
-- ─────────────────────────────────────────────────────────────────────────────

-- Converts arbitrary text to a URL-safe slug segment.
-- Requires the unaccent extension for accent removal.
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
--   e.g. "samara-joy-bryant-park-lawn-apr28"
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
  p_id     UUID DEFAULT NULL   -- pass existing row id when updating
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

-- ─────────────────────────────────────────────────────────────────────────────
-- Main concerts table
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE concerts (
  -- ── Identity ──────────────────────────────────────────────────────────
  id          UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Human-readable ID per city + year, auto-populated by trigger.
  -- Format: NYC-2026-000001 / LAX-2026-000001
  display_id  TEXT UNIQUE,

  -- SEO-friendly URL slug, auto-populated by trigger.
  -- Used at: /shows/{city}/{slug}
  slug        TEXT NOT NULL UNIQUE,

  -- ── Core show details ─────────────────────────────────────────────────
  artist_name  TEXT NOT NULL,
  venue        TEXT NOT NULL,
  date         DATE NOT NULL,
  time         TEXT,
  neighborhood TEXT NOT NULL,
  city         TEXT NOT NULL CHECK (city IN ('NYC', 'LA')),
  genre        TEXT,
  price        TEXT NOT NULL DEFAULT 'Free',
  admission_type TEXT NOT NULL DEFAULT 'Walk-up free'
    CHECK (admission_type IN ('Walk-up free', 'Free RSVP')),

  -- ── Venue metadata ────────────────────────────────────────────────────
  indoor_outdoor TEXT CHECK (indoor_outdoor IN ('Indoor', 'Outdoor', 'Both')),
  image_url      TEXT,

  -- Phase 2 moderation flag; unverified listings are shown but visually
  -- distinguished until a curator approves them.
  is_verified BOOLEAN NOT NULL DEFAULT false,

  -- ── Source / deduplication ────────────────────────────────────────────
  -- Canonical link back to the original event page (shown on the card).
  source_url  TEXT,
  -- Name of the data source (e.g. 'NYC Parks', 'Eventbrite', 'Bandsintown').
  source_name TEXT,
  -- Original event ID from the source system.
  source_id   TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Deduplication: the (source_name, source_id) pair must be unique when both
-- are present.  Rows without a source (nulls) are excluded from this check.
CREATE UNIQUE INDEX concerts_source_dedup_idx
  ON concerts (source_name, source_id)
  WHERE source_name IS NOT NULL AND source_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────────────────────
-- Before-insert trigger: auto-fill display_id and slug
-- ─────────────────────────────────────────────────────────────────────────────
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

CREATE TRIGGER concerts_auto_fields
  BEFORE INSERT ON concerts
  FOR EACH ROW EXECUTE FUNCTION concerts_before_insert();

-- ─────────────────────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────────────────────
CREATE INDEX concerts_city_date_idx ON concerts (city, date);
CREATE INDEX concerts_slug_idx      ON concerts (slug);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security  (read-only public access; writes via service role only)
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE concerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read"
  ON concerts FOR SELECT
  USING (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- Seed data  (display_id and slug auto-generated by trigger)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO concerts
  (artist_name, venue, date, time, neighborhood, city, genre,
   admission_type, indoor_outdoor, is_verified, source_name, source_id, source_url)
VALUES
  -- NYC
  ('Mutual Benefit',     'Naumburg Bandshell',          '2026-04-28', '7:00 PM', 'Central Park',     'NYC', 'Folk',        'Walk-up free', 'Outdoor', true,  'Naumburg Orchestral Concerts', 'naum-2026-001',   'https://www.naumburg.org'),
  ('Samara Joy',         'Bryant Park Lawn',             '2026-04-28', '6:30 PM', 'Midtown',           'NYC', 'Jazz',        'Walk-up free', 'Outdoor', true,  'Bryant Park',                  'bp-2026-042',     'https://bryantpark.org/programs'),
  ('Jeff Tweedy',        'SummerStage',                  '2026-04-30', '7:00 PM', 'Upper East Side',   'NYC', 'Indie Rock',  'Free RSVP',    'Outdoor', true,  'SummerStage',                  'ss-2026-019',     'https://cityparksfoundation.org/summerstage'),
  ('Arooj Aftab',        'Lincoln Center Out of Doors',  '2026-05-01', '7:30 PM', 'Upper West Side',   'NYC', 'Neo-soul',    'Free RSVP',    'Outdoor', true,  'Lincoln Center',               'lc-2026-055',     'https://www.lincolncenter.org/series/out-of-doors'),
  ('Hermanos Gutiérrez', 'Prospect Park Bandshell',      '2026-05-02', '7:00 PM', 'Prospect Heights',  'NYC', 'Latin Folk',  'Free RSVP',    'Outdoor', true,  'Celebrate Brooklyn!',          'cb-2026-007',     'https://bricartsmedia.org/celebrate-brooklyn'),
  ('Cautious Clay',      'Brooklyn Bridge Park Pier 1',  '2026-05-03', '6:00 PM', 'Brooklyn Heights',  'NYC', 'R&B',         'Free RSVP',    'Outdoor', false, 'Brooklyn Bridge Park',         'bbp-2026-033',    'https://brooklynbridgepark.org/events'),
  ('Ezra Collective',    'Fort Tryon Park',              '2026-05-09', '5:30 PM', 'Washington Heights','NYC', 'Jazz',        'Free RSVP',    'Outdoor', true,  'Fort Tryon Park Trust',        'ftp-2026-011',    'https://forttryon.org'),
  ('Faye Webster',       'Rockaway Beach Boardwalk',     '2026-05-10', '4:00 PM', 'Rockaway',          'NYC', 'Indie Pop',   'Walk-up free', 'Outdoor', false, 'NYC Parks',                    'nycparks-26-0812','https://www.nycgovparks.org/events'),
  ('Wednesday',          'McCarren Park',                '2026-05-14', '7:00 PM', 'Williamsburg',      'NYC', 'Alt-country', 'Walk-up free', 'Outdoor', false, 'NYC Parks',                    'nycparks-26-0891','https://www.nycgovparks.org/events'),
  ('Mdou Moctar',        'East River Park Amphitheater', '2026-05-16', '6:00 PM', 'Lower East Side',   'NYC', 'Psychedelic', 'Walk-up free', 'Outdoor', false, 'NYC Parks',                    'nycparks-26-0922','https://www.nycgovparks.org/events'),
  -- LA
  ('Gillian Welch',       'The Getty Center',    '2026-04-28', '6:00 PM', 'Brentwood',      'LA', 'Folk',        'Free RSVP',    'Outdoor', true,  'The Getty',          'getty-2026-018',  'https://www.getty.edu/visit/events'),
  ('Thundercat',          'Grand Performances',  '2026-04-28', '8:00 PM', 'DTLA',           'LA', 'Jazz/Funk',   'Walk-up free', 'Outdoor', true,  'Grand Performances', 'gp-2026-004',     'https://grandperformances.org'),
  ('Bedouine',            'Barnsdall Art Park',  '2026-04-29', '7:00 PM', 'Los Feliz',      'LA', 'Folk',        'Walk-up free', 'Outdoor', true,  'LA Parks',           'laparks-26-0221', 'https://www.laparks.org'),
  ('Nick Hakim',          'LACMA Jazz',          '2026-05-01', '6:30 PM', 'Mid-Wilshire',   'LA', 'Soul',        'Free RSVP',    'Outdoor', true,  'LACMA',              'lacma-2026-083',  'https://www.lacma.org/programs/free-jazz-sundays'),
  ('Cuco',                'Santa Monica Pier',   '2026-05-02', '7:30 PM', 'Santa Monica',   'LA', 'Dream Pop',   'Walk-up free', 'Outdoor', false, 'Santa Monica Pier',  'smp-2026-015',    'https://santamonicapier.org/events'),
  ('Khruangbin',          'The Hammer Museum',   '2026-05-03', '5:00 PM', 'Westwood',       'LA', 'Psychedelic', 'Free RSVP',    'Outdoor', true,  'The Hammer Museum',  'hammer-2026-029', 'https://hammer.ucla.edu/programs'),
  ('illuminati hotties',  'Levitt Pavilion',     '2026-05-07', '7:00 PM', 'MacArthur Park', 'LA', 'Indie Rock',  'Walk-up free', 'Outdoor', false, 'Levitt Foundation',  'levitt-2026-041', 'https://levittla.org'),
  ('Moonchild',           'Grand Performances',  '2026-05-09', '8:00 PM', 'DTLA',           'LA', 'Neo-soul',    'Walk-up free', 'Outdoor', true,  'Grand Performances', 'gp-2026-017',     'https://grandperformances.org'),
  ('Valerie June',        'The Getty Center',    '2026-05-14', '6:00 PM', 'Brentwood',      'LA', 'Folk',        'Free RSVP',    'Outdoor', true,  'The Getty',          'getty-2026-031',  'https://www.getty.edu/visit/events'),
  ('Sudan Archives',      'Levitt Pavilion',     '2026-05-16', '7:30 PM', 'MacArthur Park', 'LA', 'Electronic',  'Walk-up free', 'Outdoor', false, 'Levitt Foundation',  'levitt-2026-058', 'https://levittla.org');
