-- Migration: notifications and connection_requests schema reload
-- NOTE: These tables are intentionally NOT added to supabase_realtime publication.
-- Adding high-churn tables (notifications get marked read constantly, connection_requests
-- change status) causes the WAL reader to run 400k+ times, leading to 80%+ CPU exhaustion.
-- Instead:
--   - New notification badges use INSERT-only realtime on the notifications table via AppShell
--     polling fallback (60s interval) for read-state sync
--   - connection_request status changes are handled via polling on navigation

-- Reload PostgREST schema cache so the new notification_type enum
-- values (connection_request_received, connection_request_accepted)
-- are visible to the REST API for INSERT operations.
NOTIFY pgrst, 'reload schema';

