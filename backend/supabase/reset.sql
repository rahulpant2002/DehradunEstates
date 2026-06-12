-- =============================================================================
-- reset.sql  —  DESTRUCTIVE. Run this FIRST when an older schema already exists
-- in the project (e.g. the original app's tables with `listed_by`).
--
-- It drops the app's tables/types/functions so the migrations can rebuild the
-- marketplace schema cleanly. It does NOT touch auth.users, so your logins
-- survive (seed.sql backfills their profiles afterwards).
--
-- Order:  reset.sql  ->  0001 -> 0002 -> 0003 -> 0004  ->  seed.sql
-- =============================================================================

-- App tables (current + any legacy ones from earlier versions)
drop table if exists purchases        cascade;
drop table if exists property_media   cascade;
drop table if exists properties       cascade;
drop table if exists profiles         cascade;
drop table if exists saved_properties cascade;   -- legacy
drop table if exists inquiries        cascade;   -- legacy
drop table if exists integrations     cascade;   -- legacy

-- Functions
drop function if exists is_admin()                cascade;
drop function if exists handle_new_user()         cascade;
drop function if exists purchase_property(uuid)   cascade;
drop function if exists set_updated_at()          cascade;
drop function if exists set_user_role(text, text) cascade;  -- legacy, if present

-- Enums / types
drop type if exists user_role        cascade;
drop type if exists property_type    cascade;
drop type if exists price_type       cascade;
drop type if exists furnishing_type  cascade;
drop type if exists property_status  cascade;
drop type if exists media_type       cascade;
drop type if exists purchase_status  cascade;
drop type if exists inquiry_status   cascade;   -- legacy
