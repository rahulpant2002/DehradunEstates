-- =============================================================================
-- 0002_functions.sql  —  Helper functions & triggers (open marketplace)
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
-- handle_new_user() — auto-create a profile when someone signs up.
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
-- purchase_property(uuid) — the ONLY way to buy a property.
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
