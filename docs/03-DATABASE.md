# Database Design

The database is **PostgreSQL** (managed by Supabase). All tables live in the
`public` schema, authorization is enforced by **Row-Level Security (RLS)**, and a
few operations run through **SECURITY DEFINER functions**. The authoritative SQL
is in [`backend/supabase/`](../backend/supabase).

---

## 1. Entity-relationship overview

```
auth.users (managed by Supabase)
    │ 1
    │
    ▼ 1
 profiles ──────────────┐
    │ 1                 │ 1
    │                   │
    │ *                 │ *
 properties ─1───*─ property_media
    │ 1
    ├───────*── property_interests *───1 profiles   (the interested buyer)
    └───────1── purchases (legacy, one per property)
```

- One **auth user** ↔ one **profile** (created by a trigger on sign-up).
- A **profile** owns many **properties** (`properties.created_by`).
- A **property** has many **media** rows and many **interests**.
- An **interest** links a property to the interested buyer (`property_interests.user_id`).

---

## 2. Tables

### `profiles`
One row per auth user; holds public-ish contact info.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | FK → `auth.users(id)` on delete cascade |
| email | text | not null |
| full_name | text | |
| phone | text | |
| created_at / updated_at | timestamptz | `updated_at` via trigger |

### `properties`
The listings. `created_by` is the seller/owner.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | `gen_random_uuid()` |
| title | text | not null |
| description | text | |
| price | numeric(14,2) | ≥ 0 |
| price_type | enum | `sale` \| `rent` |
| property_type | enum | apartment/house/villa/plot/commercial |
| status | enum | `available` \| `sold` |
| address, city, locality | text | city defaults to 'Dehradun' |
| latitude, longitude | double precision | for the map |
| area_sqft | numeric | |
| bedrooms, bathrooms | int | |
| furnishing | enum | unfurnished/semi-furnished/fully-furnished |
| featured | boolean | homepage highlight |
| created_by | uuid | FK → `profiles(id)` on delete set null |
| created_at / updated_at | timestamptz | |

**Indexes:** status, property_type, price, price_type, created_at desc,
created_by, partial index on featured.

### `property_media`
Photos and videos (files live in Storage; rows hold the URL).

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| property_id | uuid | FK → `properties(id)` on delete cascade |
| url | text | public URL |
| storage_path | text | bucket path, used to delete the object |
| media_type | enum | `photo` \| `video` |
| sort_order | int | ordering |
| created_at | timestamptz | |

### `property_interests`
A buyer's interest in a property (the "lead").

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| property_id | uuid | FK → `properties(id)` cascade |
| user_id | uuid | FK → `profiles(id)` cascade (the buyer) |
| message | text | optional |
| created_at | timestamptz | |
| — | unique | **(property_id, user_id)** — one interest per buyer per property |

### `purchases` *(legacy / dormant)*
A one-shot purchase record with `unique(property_id)`. Retained from an earlier
"instant buy → sold" model; the current UI uses the multi-buyer interest flow.

---

## 3. Enums

`property_type`, `price_type`, `furnishing_type`, `property_status`
(`available`/`sold`), `media_type` (`photo`/`video`), `purchase_status`
(`pending`/`confirmed`/`cancelled`).

---

## 4. Functions & triggers

| Object | Purpose |
|--------|---------|
| `handle_new_user()` (trigger on `auth.users`) | Auto-creates the `profiles` row on sign-up. |
| `set_updated_at()` (triggers) | Maintains `updated_at` on `profiles` and `properties`. |
| `purchase_property(uuid)` — SECURITY DEFINER | Legacy buy RPC: locks the row, blocks buying your own listing, marks `sold` atomically. Not used by the current UI. |

---

## 5. Row-Level Security model

RLS is enabled on every table. Ownership is keyed on `created_by = auth.uid()`.

| Table | Read | Insert | Update / Delete |
|-------|------|--------|------------------|
| `profiles` | own row · any **seller's** profile · any buyer interested in **your** listings | (via trigger) | update own only |
| `properties` | **public** (anyone) | signed-in, `created_by = auth.uid()` | **owner** only |
| `property_media` | **public** | owner of the parent property | owner of the parent property |
| `property_interests` | the interested buyer **and** the property's seller | signed-in, for self, on a property that isn't yours | buyer may delete own |
| `purchases` | buyer & the property's seller | via `purchase_property()` only | — |

This is the platform's real **authorization layer** — it holds regardless of what
the client sends, which is what makes shipping the public anon/publishable key safe.

---

## 6. Storage

Two **public-read** buckets: `property-photos` and `property-videos`.

- **Read:** public (so `<img>`/`<video>` work and URLs are CDN-served).
- **Upload / delete:** only a signed-in user, and only inside the folder
  `"<property_id>/…"` of a property they own (enforced by storage policies via
  `storage.foldername(name)[1]`).

Upload path convention: `"<property_id>/<type>_<timestamp>_<index>.<ext>"`.

---

## 7. Applying / changing the schema

- One-paste setup: run [`backend/supabase/setup_all.sql`](../backend/supabase/setup_all.sql) in the Supabase SQL Editor.
- Step-by-step: migrations `0001 → 0005` then `seed.sql`.
- Rebuild an old/conflicting schema: `reset.sql` first, then the migrations.
- After DDL, if the API still serves an old shape, reload PostgREST:
  `notify pgrst, 'reload schema';` or **Settings → General → Restart project**.

Full details: [backend/README.md](../backend/README.md).
