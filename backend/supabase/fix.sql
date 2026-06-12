-- =============================================================================
-- fix.sql  —  NON-DESTRUCTIVE patch that upgrades your EXISTING database to the
-- marketplace schema. It keeps your current properties/profiles/media rows.
-- Paste the whole file into the Supabase SQL Editor and click Run.
-- =============================================================================

create extension if not exists pgcrypto;

-- 1) profiles: make sure every auth user has a profile row -------------------
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'profiles' and column_name = 'role') then
    execute 'alter table profiles alter column role set default ''user''';
  end if;
end $$;

create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (new.id, new.email,
          nullif(new.raw_user_meta_data ->> 'full_name', ''),
          nullif(new.raw_user_meta_data ->> 'phone', ''))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();

insert into profiles (id, email)
select id, email from auth.users on conflict (id) do nothing;

-- 2) properties: add the columns the app needs, migrate ownership ------------
alter table properties add column if not exists created_by uuid references profiles(id) on delete set null;
alter table properties add column if not exists latitude   double precision;
alter table properties add column if not exists longitude  double precision;

-- carry ownership over from the legacy column, then drop it (removes the
-- duplicate FK to profiles that would make the seller embed ambiguous)
do $$ begin
  if exists (select 1 from information_schema.columns
             where table_name = 'properties' and column_name = 'listed_by') then
    update properties set created_by = listed_by where created_by is null;
    execute 'alter table properties drop column listed_by cascade';
  end if;
end $$;

-- 3) property_media: add storage_path used by the uploader -------------------
alter table property_media add column if not exists storage_path text;

-- 4) purchases table + buy function -----------------------------------------
do $$ begin create type purchase_status as enum ('pending','confirmed','cancelled');
  exception when duplicate_object then null; end $$;

create table if not exists purchases (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  buyer_id    uuid not null references profiles(id) on delete cascade,
  amount      numeric(14,2) not null check (amount >= 0),
  status      purchase_status not null default 'confirmed',
  created_at  timestamptz not null default now(),
  unique (property_id)
);

create or replace function purchase_property(p_property_id uuid)
returns purchases language plpgsql security definer set search_path = public as $$
declare v_prop properties; v_purchase purchases;
begin
  if auth.uid() is null then raise exception 'You must be signed in to buy a property'; end if;
  select * into v_prop from properties where id = p_property_id for update;
  if not found then raise exception 'Property not found'; end if;
  if v_prop.created_by = auth.uid() then raise exception 'You cannot buy your own listing'; end if;
  if v_prop.status <> 'available' then raise exception 'This property is no longer available'; end if;
  insert into purchases (property_id, buyer_id, amount, status)
  values (p_property_id, auth.uid(), v_prop.price, 'confirmed') returning * into v_purchase;
  update properties set status = 'sold' where id = p_property_id;
  return v_purchase;
end $$;
grant execute on function purchase_property(uuid) to authenticated;

-- 5) Row Level Security (ownership-based) ------------------------------------
alter table properties     enable row level security;
alter table property_media enable row level security;
alter table purchases      enable row level security;

drop policy if exists properties_select on properties;
create policy properties_select on properties for select using (true);
drop policy if exists properties_insert_own on properties;
create policy properties_insert_own on properties for insert to authenticated
  with check (created_by = auth.uid());
drop policy if exists properties_update_own on properties;
create policy properties_update_own on properties for update to authenticated
  using (created_by = auth.uid()) with check (created_by = auth.uid());
drop policy if exists properties_delete_own on properties;
create policy properties_delete_own on properties for delete to authenticated
  using (created_by = auth.uid());

drop policy if exists media_select on property_media;
create policy media_select on property_media for select using (true);
drop policy if exists media_insert_owner on property_media;
create policy media_insert_owner on property_media for insert to authenticated
  with check (exists (select 1 from properties p
                      where p.id = property_media.property_id and p.created_by = auth.uid()));
drop policy if exists media_delete_owner on property_media;
create policy media_delete_owner on property_media for delete to authenticated
  using (exists (select 1 from properties p
                 where p.id = property_media.property_id and p.created_by = auth.uid()));

drop policy if exists purchases_select on purchases;
create policy purchases_select on purchases for select to authenticated
  using (buyer_id = auth.uid()
         or exists (select 1 from properties p
                    where p.id = purchases.property_id and p.created_by = auth.uid()));

-- 6) Storage buckets + owner upload/delete -----------------------------------
insert into storage.buckets (id, name, public) values
  ('property-photos','property-photos', true),
  ('property-videos','property-videos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "media public read" on storage.objects;
create policy "media public read" on storage.objects for select
  using (bucket_id in ('property-photos','property-videos'));
drop policy if exists "media owner upload" on storage.objects;
create policy "media owner upload" on storage.objects for insert to authenticated
  with check (bucket_id in ('property-photos','property-videos')
    and exists (select 1 from properties p
                where p.id::text = (storage.foldername(name))[1] and p.created_by = auth.uid()));
drop policy if exists "media owner delete" on storage.objects;
create policy "media owner delete" on storage.objects for delete to authenticated
  using (bucket_id in ('property-photos','property-videos')
    and exists (select 1 from properties p
                where p.id::text = (storage.foldername(name))[1] and p.created_by = auth.uid()));
