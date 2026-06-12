-- =============================================================================
-- 0003_policies.sql  —  Row Level Security (open marketplace, ownership-based)
--
-- Access model:
--   profiles      : you see your own row; everyone sees the profile of any
--                   SELLER (a user who has listed a property). Update own only.
--   properties    : public read; any signed-in user may INSERT a listing they
--                   own; only the owner may UPDATE/DELETE it.
--   property_media: public read; only the owner of the parent property may
--                   INSERT/DELETE media.
--   purchases     : visible to the buyer and to the seller of that property.
--                   INSERT happens only inside purchase_property().
-- =============================================================================

alter table profiles       enable row level security;
alter table properties     enable row level security;
alter table property_media enable row level security;
alter table purchases      enable row level security;

-- ---------------------------- profiles --------------------------------------
-- Your own profile, or the profile of anyone who is a seller (so buyers can
-- see contact details on a listing). Non-sellers' contacts stay private.
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select
  using (
    id = auth.uid()
    or exists (select 1 from properties p where p.created_by = profiles.id)
  );

drop policy if exists profiles_update_own on profiles;
create policy profiles_update_own on profiles
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- ---------------------------- properties ------------------------------------
drop policy if exists properties_select on properties;
create policy properties_select on properties
  for select using (true);

drop policy if exists properties_insert_own on properties;
create policy properties_insert_own on properties
  for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists properties_update_own on properties;
create policy properties_update_own on properties
  for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists properties_delete_own on properties;
create policy properties_delete_own on properties
  for delete to authenticated
  using (created_by = auth.uid());

-- ---------------------------- property_media --------------------------------
drop policy if exists media_select on property_media;
create policy media_select on property_media
  for select using (true);

drop policy if exists media_insert_owner on property_media;
create policy media_insert_owner on property_media
  for insert to authenticated
  with check (
    exists (select 1 from properties p
            where p.id = property_media.property_id and p.created_by = auth.uid())
  );

drop policy if exists media_delete_owner on property_media;
create policy media_delete_owner on property_media
  for delete to authenticated
  using (
    exists (select 1 from properties p
            where p.id = property_media.property_id and p.created_by = auth.uid())
  );

-- ---------------------------- purchases -------------------------------------
drop policy if exists purchases_select on purchases;
create policy purchases_select on purchases
  for select to authenticated
  using (
    buyer_id = auth.uid()
    or exists (select 1 from properties p
               where p.id = purchases.property_id and p.created_by = auth.uid())
  );
-- NOTE: no INSERT/UPDATE/DELETE policies — writes go through purchase_property().
