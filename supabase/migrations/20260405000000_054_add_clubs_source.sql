-- Add source column to clubs to distinguish paddlescores-seeded vs user-created clubs
ALTER TABLE clubs ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'user';

-- Index for fast filtering by source + location
CREATE INDEX IF NOT EXISTS idx_clubs_source ON clubs(source);
CREATE INDEX IF NOT EXISTS idx_clubs_location ON clubs(location_lat, location_lng) WHERE location_lat IS NOT NULL AND location_lng IS NOT NULL;
