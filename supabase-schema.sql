-- ═══════════════════════════════════════════════════════════════
-- Family Archive — Full Database Schema
-- Globe Journeys + Family Tree + Connection Layer
-- ═══════════════════════════════════════════════════════════════

-- ── Globe: People ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS globe_people (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       BIGINT REFERENCES families(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  color           TEXT DEFAULT '#c9a227',
  symbol          TEXT DEFAULT 'circle' CHECK (symbol IN ('circle','star','diamond','heart')),
  visible         BOOLEAN DEFAULT true,
  sort_order      INT DEFAULT 0,
  tree_person_id  BIGINT REFERENCES people(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Globe: Stops (Stations) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS globe_stops (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  globe_person_id UUID REFERENCES globe_people(id) ON DELETE CASCADE,
  year            INT,
  is_bce          BOOLEAN DEFAULT false,
  month           INT CHECK (month BETWEEN 1 AND 12),
  day             INT CHECK (day BETWEEN 1 AND 31),
  year_hebrew     TEXT,
  month_hebrew    TEXT,
  day_hebrew      TEXT,
  country         TEXT,
  city            TEXT,
  address         TEXT,
  lat             DOUBLE PRECISION,
  lng             DOUBLE PRECISION,
  stop_type       TEXT DEFAULT 'residence' CHECK (stop_type IN (
    'birth','childhood','residence','transit','work',
    'study','marriage','death','pilgrimage','exile','other'
  )),
  note            TEXT,
  photo_url       TEXT,
  sources         TEXT[],
  is_public       BOOLEAN DEFAULT true,
  priority        TEXT DEFAULT 'normal' CHECK (priority IN ('normal','highlighted')),
  sort_order      INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Globe: Routes (between stops) ──────────────────────────────
CREATE TABLE IF NOT EXISTS globe_routes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  globe_person_id UUID REFERENCES globe_people(id) ON DELETE CASCADE,
  from_stop_id    UUID REFERENCES globe_stops(id) ON DELETE CASCADE,
  to_stop_id      UUID REFERENCES globe_stops(id) ON DELETE CASCADE,
  travel_type     TEXT DEFAULT 'default' CHECK (travel_type IN (
    'default','ship','train','exile','pilgrimage',
    'captivity','unknown','walking'
  )),
  note            TEXT,
  duration        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Globe: Settings ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS globe_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       BIGINT REFERENCES families(id) ON DELETE CASCADE UNIQUE,
  bg_color        TEXT DEFAULT '#030508',
  show_stars      BOOLEAN DEFAULT true,
  star_count      INT DEFAULT 2000,
  star_size       REAL DEFAULT 1.0,
  show_atmosphere BOOLEAN DEFAULT true,
  atmosphere_intensity REAL DEFAULT 0.2,
  line_width      REAL DEFAULT 1.5,
  point_size      REAL DEFAULT 1.0,
  show_country_names BOOLEAN DEFAULT false,
  show_stop_names TEXT DEFAULT 'zoom' CHECK (show_stop_names IN ('yes','no','zoom')),
  animation_speed REAL DEFAULT 1.0,
  auto_rotate     BOOLEAN DEFAULT true,
  rotate_speed    REAL DEFAULT 0.3,
  auto_play       BOOLEAN DEFAULT false,
  loop_animation  BOOLEAN DEFAULT true,
  show_timeline   BOOLEAN DEFAULT true,
  year_format     TEXT DEFAULT 'both' CHECK (year_format IN ('gregorian','hebrew','both')),
  show_milestones BOOLEAN DEFAULT true,
  allow_street_zoom BOOLEAN DEFAULT true,
  map_style       TEXT DEFAULT 'satellite',
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Globe: Change History ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS globe_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       BIGINT REFERENCES families(id) ON DELETE CASCADE,
  user_id         UUID,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       UUID,
  details         JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Globe: Share Links ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS globe_shares (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       BIGINT REFERENCES families(id) ON DELETE CASCADE,
  globe_person_id UUID REFERENCES globe_people(id) ON DELETE SET NULL,
  token           TEXT UNIQUE DEFAULT gen_random_uuid()::TEXT,
  expires_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Tree: Extended people fields ───────────────────────────────
-- (extends existing people table)
ALTER TABLE people ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS maiden_name TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS gender TEXT DEFAULT 'unknown';
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_is_bce BOOLEAN DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_is_approximate BOOLEAN DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_month INT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_day INT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS birth_year_hebrew TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS death_is_bce BOOLEAN DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS death_is_approximate BOOLEAN DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS death_month INT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS death_day INT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS death_year_hebrew TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS death_place TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS is_alive BOOLEAN DEFAULT false;
ALTER TABLE people ADD COLUMN IF NOT EXISTS profession TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS religion TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS origin_country TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS languages TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS notes_internal TEXT;
ALTER TABLE people ADD COLUMN IF NOT EXISTS photos_gallery TEXT[];
ALTER TABLE people ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE people ADD COLUMN IF NOT EXISTS globe_person_id UUID REFERENCES globe_people(id) ON DELETE SET NULL;

-- ── Tree: Relationships ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tree_relationships (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       BIGINT REFERENCES families(id) ON DELETE CASCADE,
  person_a_id     BIGINT REFERENCES people(id) ON DELETE CASCADE,
  person_b_id     BIGINT REFERENCES people(id) ON DELETE CASCADE,
  relation_type   TEXT NOT NULL CHECK (relation_type IN (
    'parent','child','spouse','engaged','partner'
  )),
  marriage_year   INT,
  marriage_is_bce BOOLEAN DEFAULT false,
  divorce_year    INT,
  divorce_is_bce  BOOLEAN DEFAULT false,
  note            TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Tree: Settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tree_settings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       BIGINT REFERENCES families(id) ON DELETE CASCADE UNIQUE,
  title           TEXT,
  date_language   TEXT DEFAULT 'both' CHECK (date_language IN ('gregorian','hebrew','both')),
  bce_format      TEXT DEFAULT 'hebrew' CHECK (bce_format IN ('hebrew','bce','negative')),
  show_approximate BOOLEAN DEFAULT true,
  visibility      TEXT DEFAULT 'private' CHECK (visibility IN ('private','public','link')),
  allow_pdf       BOOLEAN DEFAULT false,
  primary_color   TEXT DEFAULT '#c9a227',
  card_style      TEXT DEFAULT 'dark' CHECK (card_style IN ('minimal','framed','dark')),
  font_family     TEXT DEFAULT 'default',
  popup_photo_size TEXT DEFAULT 'medium' CHECK (popup_photo_size IN ('small','medium','large')),
  popup_show_gallery BOOLEAN DEFAULT true,
  popup_show_globe BOOLEAN DEFAULT true,
  blood_line_color TEXT DEFAULT '#c9a227',
  blood_line_width REAL DEFAULT 2,
  blood_line_style TEXT DEFAULT 'curved' CHECK (blood_line_style IN ('straight','curved','angular')),
  spouse_line_color TEXT DEFAULT '#8b6914',
  spouse_line_width REAL DEFAULT 1.5,
  spouse_line_style TEXT DEFAULT 'dashed' CHECK (spouse_line_style IN ('dashed','dotted','straight')),
  card_size       TEXT DEFAULT 'medium' CHECK (card_size IN ('small','medium','large')),
  generation_gap  INT DEFAULT 120,
  sibling_gap     INT DEFAULT 60,
  tree_direction  TEXT DEFAULT 'top-down' CHECK (tree_direction IN ('top-down','bottom-up')),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Tree: Change History ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS tree_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       BIGINT REFERENCES families(id) ON DELETE CASCADE,
  user_id         UUID,
  action          TEXT NOT NULL,
  entity_type     TEXT NOT NULL,
  entity_id       TEXT,
  details         JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- ── Indexes ────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_globe_stops_person ON globe_stops(globe_person_id);
CREATE INDEX IF NOT EXISTS idx_globe_stops_year ON globe_stops(year);
CREATE INDEX IF NOT EXISTS idx_globe_routes_person ON globe_routes(globe_person_id);
CREATE INDEX IF NOT EXISTS idx_globe_people_family ON globe_people(family_id);
CREATE INDEX IF NOT EXISTS idx_tree_rel_a ON tree_relationships(person_a_id);
CREATE INDEX IF NOT EXISTS idx_tree_rel_b ON tree_relationships(person_b_id);
CREATE INDEX IF NOT EXISTS idx_tree_rel_family ON tree_relationships(family_id);
CREATE INDEX IF NOT EXISTS idx_globe_history_family ON globe_history(family_id);
CREATE INDEX IF NOT EXISTS idx_tree_history_family ON tree_history(family_id);

-- ── Updated_at triggers ────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER globe_people_updated BEFORE UPDATE ON globe_people
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER globe_stops_updated BEFORE UPDATE ON globe_stops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER globe_settings_updated BEFORE UPDATE ON globe_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TRIGGER tree_settings_updated BEFORE UPDATE ON tree_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
