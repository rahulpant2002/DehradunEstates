-- ============================================================
-- setup_all.sql  —  paste this whole file into the Supabase SQL
-- Editor and run once. It rebuilds the marketplace schema.
-- (reset -> schema -> functions -> policies -> storage -> interests -> seed)
-- ============================================================

-- >>>>>>>>>>>>>>>>>>>> reset.sql >>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- reset.sql  â€”  DESTRUCTIVE. Run this FIRST when an older schema already exists
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


-- >>>>>>>>>>>>>>>>>>>> migrations\0001_schema.sql >>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- 0001_schema.sql  â€”  Core schema for DehradunEstates (open marketplace)
-- Anyone signed in can list properties and buy others' listings.
-- Tables: profiles, properties, property_media, purchases
-- =============================================================================

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- Enums (guarded so the migration can be re-run safely)
-- ----------------------------------------------------------------------------
do $$ begin
  create type property_type    as enum ('apartment','house','villa','plot','commercial'); exception when duplicate_object then null; end $$;
do $$ begin
  create type price_type       as enum ('sale','rent');                              exception when duplicate_object then null; end $$;
do $$ begin
  create type furnishing_type  as enum ('unfurnished','semi-furnished','fully-furnished'); exception when duplicate_object then null; end $$;
do $$ begin
  create type property_status  as enum ('available','sold');                         exception when duplicate_object then null; end $$;
do $$ begin
  create type media_type       as enum ('photo','video');                            exception when duplicate_object then null; end $$;
do $$ begin
  create type purchase_status  as enum ('pending','confirmed','cancelled');          exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- profiles  â€” one row per auth.users row (created by trigger, see 0002)
-- ----------------------------------------------------------------------------
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text not null,
  full_name   text,
  phone       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- properties  â€” listings. created_by is the SELLER who owns the listing.
-- ----------------------------------------------------------------------------
create table if not exists properties (
  id            uuid primary key default gen_random_uuid(),
  title         text not null,
  description   text,
  price         numeric(14,2) not null check (price >= 0),
  price_type    price_type not null default 'sale',
  property_type property_type not null default 'apartment',
  status        property_status not null default 'available',
  address       text not null,
  city          text not null default 'Dehradun',
  locality      text,
  latitude      double precision,
  longitude     double precision,
  area_sqft     numeric(10,2) check (area_sqft is null or area_sqft >= 0),
  bedrooms      int check (bedrooms is null or bedrooms >= 0),
  bathrooms     int check (bathrooms is null or bathrooms >= 0),
  furnishing    furnishing_type,
  featured      boolean not null default false,
  created_by    uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_properties_status      on properties(status);
create index if not exists idx_properties_type        on properties(property_type);
create index if not exists idx_properties_price_type  on properties(price_type);
create index if not exists idx_properties_price       on properties(price);
create index if not exists idx_properties_created_at  on properties(created_at desc);
create index if not exists idx_properties_created_by  on properties(created_by);
create index if not exists idx_properties_featured    on properties(featured) where featured;

-- ----------------------------------------------------------------------------
-- property_media  â€” photos & videos stored in Supabase Storage
-- ----------------------------------------------------------------------------
create table if not exists property_media (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  url          text not null,                 -- public URL
  storage_path text,                           -- bucket path, used to delete the object
  media_type   media_type not null,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

create index if not exists idx_media_property on property_media(property_id);

-- ----------------------------------------------------------------------------
-- purchases  â€” a buyer buys a property. One purchase per property (unique).
-- ----------------------------------------------------------------------------
create table if not exists purchases (
  id           uuid primary key default gen_random_uuid(),
  property_id  uuid not null references properties(id) on delete cascade,
  buyer_id     uuid not null references profiles(id) on delete cascade,
  amount       numeric(14,2) not null check (amount >= 0),
  status       purchase_status not null default 'confirmed',
  created_at   timestamptz not null default now(),
  unique (property_id)            -- a property can only be sold once
);

create index if not exists idx_purchases_buyer on purchases(buyer_id);


-- >>>>>>>>>>>>>>>>>>>> migrations\0002_functions.sql >>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- 0002_functions.sql  â€”  Helper functions & triggers (open marketplace)
-- =============================================================================

-- ----------------------------------------------------------------------------
-- updated_at maintenance
-- ----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

drop trigger if exists trg_profiles_updated on profiles;
create trigger trg_profiles_updated   before update on profiles
  for each row execute function set_updated_at();

drop trigger if exists trg_properties_updated on properties;
create trigger trg_properties_updated before update on properties
  for each row execute function set_updated_at();

-- ----------------------------------------------------------------------------
-- handle_new_user() â€” auto-create a profile when someone signs up.
-- ----------------------------------------------------------------------------
create or replace function handle_new_user()
returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, phone)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ----------------------------------------------------------------------------
-- purchase_property(uuid) â€” the ONLY way to buy a property.
-- Locks the row, blocks buying your own listing, validates availability,
-- records the purchase and marks the property sold atomically.
-- SECURITY DEFINER so it can flip status under RLS.
-- ----------------------------------------------------------------------------
create or replace function purchase_property(p_property_id uuid)
returns purchases
language plpgsql security definer set search_path = public as $$
declare
  v_prop     properties;
  v_purchase purchases;
begin
  if auth.uid() is null then
    raise exception 'You must be signed in to buy a property';
  end if;

  select * into v_prop from properties where id = p_property_id for update;
  if not found then
    raise exception 'Property not found';
  end if;

  if v_prop.created_by = auth.uid() then
    raise exception 'You cannot buy your own listing';
  end if;

  if v_prop.status <> 'available' then
    raise exception 'This property is no longer available';
  end if;

  insert into purchases (property_id, buyer_id, amount, status)
  values (p_property_id, auth.uid(), v_prop.price, 'confirmed')
  returning * into v_purchase;

  update properties set status = 'sold' where id = p_property_id;

  return v_purchase;
end $$;

grant execute on function purchase_property(uuid) to authenticated;


-- >>>>>>>>>>>>>>>>>>>> migrations\0003_policies.sql >>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- 0003_policies.sql  â€”  Row Level Security (open marketplace, ownership-based)
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
-- NOTE: no INSERT/UPDATE/DELETE policies â€” writes go through purchase_property().


-- >>>>>>>>>>>>>>>>>>>> migrations\0004_storage.sql >>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- 0004_storage.sql  â€”  Storage buckets for property media + access policies
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


-- >>>>>>>>>>>>>>>>>>>> migrations\0005_interests.sql >>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- 0005_interests.sql  â€”  Buyer "interest" leads.
-- When a user clicks Buy, a row is recorded here; the SELLER can then see
-- everyone interested in their listing (with contact details). Many buyers can
-- be interested in the same property (unlike `purchases`, which is one-shot).
-- =============================================================================

create table if not exists property_interests (
  id          uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  message     text,
  created_at  timestamptz not null default now(),
  unique (property_id, user_id)            -- one interest per buyer per property
);

create index if not exists idx_interests_property on property_interests(property_id);
create index if not exists idx_interests_user     on property_interests(user_id);

alter table property_interests enable row level security;

-- A signed-in user may register interest for THEMSELVES, on a property that is
-- not their own listing.
drop policy if exists interests_insert on property_interests;
create policy interests_insert on property_interests
  for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from properties p
                where p.id = property_id and p.created_by is distinct from auth.uid())
  );

-- Visible to the interested buyer (their own) and to the SELLER of the property.
drop policy if exists interests_select on property_interests;
create policy interests_select on property_interests
  for select to authenticated
  using (
    user_id = auth.uid()
    or exists (select 1 from properties p
               where p.id = property_interests.property_id and p.created_by = auth.uid())
  );

-- A buyer may withdraw their interest.
drop policy if exists interests_delete on property_interests;
create policy interests_delete on property_interests
  for delete to authenticated
  using (user_id = auth.uid());

-- ----------------------------------------------------------------------------
-- Let a seller read the contact profile of anyone interested in their listings
-- (extends the existing seller-visibility rule on profiles).
-- ----------------------------------------------------------------------------
drop policy if exists profiles_select on profiles;
create policy profiles_select on profiles
  for select
  using (
    id = auth.uid()
    or exists (select 1 from properties p where p.created_by = profiles.id)
    or exists (
      select 1 from property_interests i
      join properties p on p.id = i.property_id
      where i.user_id = profiles.id and p.created_by = auth.uid()
    )
  );


-- >>>>>>>>>>>>>>>>>>>> seed.sql >>>>>>>>>>>>>>>>>>>>
-- =============================================================================
-- seed.sql  â€”  Sample properties + media (safe to run multiple times).
-- created_by is left NULL (no auth user required to seed).
-- Photos use the public Pexels CDN; one listing includes a sample video.
-- =============================================================================

-- Backfill profiles for any users who signed up before the schema rebuild,
-- so their existing logins keep working.
insert into profiles (id, email)
select id, email from auth.users
on conflict (id) do nothing;

insert into properties
  (id, title, description, price, price_type, property_type, status, address, city, locality,
   latitude, longitude, area_sqft, bedrooms, bathrooms, furnishing, featured)
values
  ('11111111-1111-1111-1111-111111111101',
   '3BHK Apartment on Rajpur Road',
   'Spacious 3BHK with modern interiors, modular kitchen and a large balcony overlooking the hills.',
   8500000, 'sale', 'apartment', 'available', '12, Rajpur Road', 'Dehradun', 'Rajpur Road',
   30.3489, 78.0712, 1450, 3, 2, 'semi-furnished', true),

  ('11111111-1111-1111-1111-111111111102',
   'Luxury Villa in Vasant Vihar',
   'Independent 4BHK villa with a private lawn, car porch and a rooftop terrace in a gated colony.',
   21500000, 'sale', 'villa', 'available', '47, Block B, Vasant Vihar', 'Dehradun', 'Vasant Vihar',
   30.3256, 78.0008, 3200, 4, 4, 'fully-furnished', true),

  ('11111111-1111-1111-1111-111111111103',
   'Cozy 2BHK for Rent in Dalanwala',
   'Well-maintained 2BHK on a quiet residential lane, close to the market, hospitals and Gandhi Park.',
   22000, 'rent', 'apartment', 'available', '8, EC Road, Dalanwala', 'Dehradun', 'Dalanwala',
   30.3142, 78.0489, 980, 2, 2, 'semi-furnished', true),

  ('11111111-1111-1111-1111-111111111104',
   'Independent House near Sahastradhara Road',
   'Double-storey house with 3 bedrooms, a pooja room and ample parking; great connectivity to the IT park.',
   12500000, 'sale', 'house', 'available', '21, Kulhan, Sahastradhara Road', 'Dehradun', 'Sahastradhara Road',
   30.3617, 78.0846, 2100, 3, 3, 'unfurnished', true),

  ('11111111-1111-1111-1111-111111111105',
   'Residential Plot in Jakhan',
   'East-facing residential plot with clear title and approved layout. Great investment near Rajpur Road.',
   6500000, 'sale', 'plot', 'available', 'Plot 14, Jakhan', 'Dehradun', 'Jakhan',
   30.3556, 78.0689, 2000, null, null, null, false),

  ('11111111-1111-1111-1111-111111111106',
   '4BHK Bungalow on Mussoorie Road',
   'Elegant hillside bungalow with panoramic valley views, landscaped garden and a fireplace.',
   32000000, 'sale', 'villa', 'available', '9, Hathipaon, Mussoorie Road', 'Dehradun', 'Mussoorie Road',
   30.3897, 78.0567, 4100, 4, 5, 'fully-furnished', true)
on conflict (id) do nothing;

insert into property_media (property_id, url, media_type, sort_order)
values
  ('11111111-1111-1111-1111-111111111101', 'https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111101', 'https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),
  ('11111111-1111-1111-1111-111111111101', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'video', 100),

  ('11111111-1111-1111-1111-111111111102', 'https://images.pexels.com/photos/1396122/pexels-photo-1396122.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111102', 'https://images.pexels.com/photos/2102587/pexels-photo-2102587.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),
  ('11111111-1111-1111-1111-111111111102', 'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 2),

  ('11111111-1111-1111-1111-111111111103', 'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111103', 'https://images.pexels.com/photos/1571468/pexels-photo-1571468.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),

  ('11111111-1111-1111-1111-111111111104', 'https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111104', 'https://images.pexels.com/photos/280229/pexels-photo-280229.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),
  ('11111111-1111-1111-1111-111111111104', 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 'video', 100),

  ('11111111-1111-1111-1111-111111111105', 'https://images.pexels.com/photos/164516/pexels-photo-164516.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111105', 'https://images.pexels.com/photos/209296/pexels-photo-209296.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1),

  ('11111111-1111-1111-1111-111111111106', 'https://images.pexels.com/photos/1396132/pexels-photo-1396132.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 0),
  ('11111111-1111-1111-1111-111111111106', 'https://images.pexels.com/photos/1370704/pexels-photo-1370704.jpeg?auto=compress&cs=tinysrgb&w=1200', 'photo', 1)
on conflict do nothing;



