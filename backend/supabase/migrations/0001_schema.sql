-- =============================================================================
-- 0001_schema.sql  —  Core schema for DehradunEstates (open marketplace)
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
-- profiles  — one row per auth.users row (created by trigger, see 0002)
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
-- properties  — listings. created_by is the SELLER who owns the listing.
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
-- property_media  — photos & videos stored in Supabase Storage
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
-- purchases  — a buyer buys a property. One purchase per property (unique).
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
