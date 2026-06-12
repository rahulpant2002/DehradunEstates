-- =============================================================================
-- 0004_storage.sql  —  Storage buckets for property media + access policies
--
--   property-photos / property-videos : public READ.
--   A signed-in user may UPLOAD/DELETE objects only inside the folder of a
--   property they own. Files are stored at "<property_id>/<file>", so the
--   first path segment identifies the property.
-- =============================================================================

insert into storage.buckets (id, name, public)
values
  ('property-photos', 'property-photos', true),
  ('property-videos', 'property-videos', true)
on conflict (id) do update set public = excluded.public;

-- Public read of the two media buckets ---------------------------------------
drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects
  for select
  using (bucket_id in ('property-photos', 'property-videos'));

-- Upload only into a folder for a property you own ---------------------------
drop policy if exists "media owner upload" on storage.objects;
create policy "media owner upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('property-photos', 'property-videos')
    and exists (
      select 1 from properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.created_by = auth.uid()
    )
  );

-- Delete only from a folder for a property you own ---------------------------
drop policy if exists "media owner delete" on storage.objects;
create policy "media owner delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('property-photos', 'property-videos')
    and exists (
      select 1 from properties p
      where p.id::text = (storage.foldername(name))[1]
        and p.created_by = auth.uid()
    )
  );
