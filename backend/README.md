# DehradunEstates — Backend (Supabase)

This folder holds the entire backend: the Postgres schema, Row-Level-Security
policies, database functions, and Storage buckets for **DehradunEstates** — an
open property marketplace where **anyone signed in can list (sell) properties
and buy other people's listings**. There is no admin role and no separate Node
server; the backend is **Supabase** (hosted Postgres + Auth + Storage).

## Data model

| Table            | Purpose                                                          |
|------------------|------------------------------------------------------------------|
| `profiles`       | One row per auth user (name, phone, email). Created on sign-up.   |
| `properties`     | Listings. `created_by` is the **seller** who owns the listing.   |
| `property_media` | Photos & videos for a property (files live in Storage).          |
| `purchases`      | A buyer buying a property. One purchase per property.            |

### Who can do what (enforced by RLS, not just the UI)

- **Anyone (even logged-out):** browse all properties and media.
- **Any signed-in user:**
  - **Sell:** create listings they own and upload/delete that listing's media.
  - **Manage:** update/delete only their **own** listings.
  - **Buy:** purchase any *available* listing that isn't their own
    (via `purchase_property()`), and see their own purchases.
- A seller can see the purchases made on their listings.

All writes are locked down server-side, so the rules hold no matter what the
client does. Ownership is keyed on `created_by = auth.uid()`.

## Files

```
backend/supabase/
  migrations/
    0001_schema.sql      tables, enums, indexes
    0002_functions.sql   triggers + purchase_property()
    0003_policies.sql    Row Level Security (ownership-based)
    0004_storage.sql     media buckets + owner-only upload/delete
  seed.sql               sample properties & media
  config.toml            Supabase CLI project config
```

## Setup

### Option A — Supabase Dashboard (no CLI)

1. Create a project at https://supabase.com (or use your existing one).
2. **If the project already has an older schema** (e.g. a `properties` table with
   a `listed_by` column — symptom: *"Could not find the 'created_by' column"* on
   submit), first run **`reset.sql`** once. It drops the old tables/types so the
   migrations can rebuild cleanly. (Skip this on a brand-new project.)
3. Open **SQL Editor** and run each file **in order**:
   `0001_schema.sql` → `0002_functions.sql` → `0003_policies.sql` →
   `0004_storage.sql`, then `seed.sql` (it also backfills profiles for any
   existing users).
4. Copy **Project URL** and the **anon public** key from
   *Project Settings → API* into `frontend/.env` (see `frontend/.env.example`).

> The migrations use `create table if not exists`, so they **do not alter an
> existing table**. On a project that already has the old schema you must run
> `reset.sql` first — otherwise the new columns (like `created_by`) won't appear.

### Option B — Supabase CLI

```bash
cd backend
supabase link --project-ref <your-project-ref>
supabase db push            # applies migrations/
# seed (local dev): supabase db reset
```

## How selling & buying work

- **Sell:** the app inserts a `properties` row with `created_by = auth.uid()`
  (the RLS `with check` enforces this), then uploads files to Storage and
  records `property_media` rows. Uploads are only allowed into the folder
  `"<property_id>/…"` of a property you own.
- **Buy:** the app calls the `purchase_property(property_id)` RPC. It runs as
  `SECURITY DEFINER` and, in one transaction, locks the row, refuses to let you
  buy your own listing, checks the property is still `available`, records the
  purchase at the listing price, and flips the property to `sold`. The
  `unique (property_id)` constraint guarantees a property can never be sold
  twice, even under concurrent clicks.

## Storage

Two **public-read** buckets — `property-photos` and `property-videos`. A
signed-in user can upload/delete objects only inside the folder of a property
they own. The app uploads to `<property_id>/<type>_<timestamp>_<i>.<ext>` and
stores the resulting public URL in `property_media.url`.
