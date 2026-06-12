-- =============================================================================
-- 0005_interests.sql  —  Buyer "interest" leads.
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
