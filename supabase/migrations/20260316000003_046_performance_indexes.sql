-- Migration: 046_performance_indexes
-- Index Advisor suggestions from query performance analysis (2026-03-16)
--
-- These indexes were identified by the Supabase Index Advisor as high-impact:
--   stories.created_at      cost 21.78 → 4.27
--   clubs.name              cost 16.55 → 2.95
--   competitions.start_date cost 24.48 → 3.44
--   connections.status      cost 46.25 → 32.60
--
-- IF NOT EXISTS: idempotent — safe to re-run.

CREATE INDEX IF NOT EXISTS idx_stories_created_at
  ON public.stories USING btree (created_at);

CREATE INDEX IF NOT EXISTS idx_clubs_name
  ON public.clubs USING btree (name);

CREATE INDEX IF NOT EXISTS idx_competitions_start_date
  ON public.competitions USING btree (start_date);

CREATE INDEX IF NOT EXISTS idx_connections_status
  ON public.connections USING btree (status);
