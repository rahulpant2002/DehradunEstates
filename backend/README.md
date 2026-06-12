# DehradunEstates — Backend (Supabase)

This folder holds the entire backend: the Postgres schema, Row-Level-Security
policies, database functions, and Storage buckets for **DehradunEstates** — an
open property marketplace where **anyone signed in can list (sell) properties
and express interest in other people's listings**. There is no admin role and no
separate Node server; the backend is **Supabase** (hosted Postgres + Auth + Storage).

See the [root README](../README.md) for the project overview.

## Data model

| Table                | Purpose                                                          |
|----------------------|------------------------------------------------------------------|
| `profiles`           | One row per auth user (name, phone, email). Created on sign-up.   |
| `properties`         | Listings. `created_by` is the **seller** who owns the listing.   |
| `property_media`     | Photos & videos for a property (files live in Storage).          |
| `property_interests` | A buyer's interest in a property. Sellers see who's interested.   |
| `purchases`          | One-shot purchase record (legacy; UI now uses interests).        |

### Who can do what (enforced by RLS, not just the UI)

- **Anyone (even logged-out):** browse all properties and media.
- **Any signed-in user:**
  - **Sell:** create listings they own and upload/delete that listing's media.
  - **Manage:** update/delete only their **own** listings.
  - **Express interest** ("Buy"): record interest in any listing that isn't their own.
- **A seller** sees everyone interested in **their** listings — including each
  interested buyer's contact profile (name/phone/email).

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
    0005_interests.sql   property_interests table + seller-visibility rule
  seed.sql               sample properties & media (+ profile backfill)
  setup_all.sql          ← all of the above concatenated, for a one-paste setup
  reset.sql              drops app objects so the schema can be rebuilt cleanly
  fix.sql                non-destructive patch to upgrade an OLD schema in place
  config.toml            Supabase CLI project config
backend/
  run-fix.mjs            optional Node script to apply SQL + reload PostgREST
  package.json           dev dep for run-fix.mjs (pg driver)
```

## Setup

### Easiest — paste `setup_all.sql` (recommended)
1. Create a project at https://supabase.com (or use an existing one).
2. Open **SQL Editor** → paste the contents of **`setup_all.sql`** → **Run**.
   (It runs: reset → schema → functions → policies → storage → interests → seed.)
3. Put the project's **API URL** and **anon/publishable key** into `frontend/.env`
   (see `frontend/.env.example`).

### Step-by-step (Dashboard)
Run each file **in order**: `0001` → `0002` → `0003` → `0004` → `0005`, then `seed.sql`.
If the project already has an **older** schema (a `properties` table with
`listed_by`), run **`reset.sql`** first — the migrations use
`create table if not exists`, so they won't alter an existing table.

### Supabase CLI
```bash
cd backend
supabase link --project-ref <your-project-ref>
supabase db push            # applies migrations/
# local dev: supabase db reset   # migrations + seed.sql
```

## How selling & interest work

- **Sell:** the app inserts a `properties` row with `created_by = auth.uid()`
  (the RLS `with check` enforces this), then uploads files to Storage and records
  `property_media` rows. Uploads are only allowed into the `"<property_id>/…"`
  folder of a property you own.
- **Express interest ("Buy"):** the app inserts into `property_interests`
  (`unique (property_id, user_id)` → one interest per buyer per property). The
  seller can read those rows for their own listings, and — via an extra
  `profiles` select policy — the **contact profile** of each interested buyer.
- `purchase_property(uuid)` (a `SECURITY DEFINER` RPC that marks a property
  `sold`) still exists for a one-shot purchase model, but the current UI uses the
  multi-buyer **interest** flow instead.

## Storage

Two **public-read** buckets — `property-photos` and `property-videos`. A
signed-in user can upload/delete objects only inside the folder of a property
they own. The app uploads to `<property_id>/<type>_<timestamp>_<i>.<ext>` and
stores the resulting public URL in `property_media.url`.

## Auth notes

- A trigger (`handle_new_user`) auto-creates a `profiles` row on sign-up.
- To create a pre-verified user: **Authentication → Users → Add user →
  Auto Confirm**. To stop requiring email verification for new sign-ups, turn off
  **Confirm email** in the Email provider settings.

## Gotchas

- **Right project:** the project in `frontend/.env` must be the **same** one you
  ran the SQL on. A mismatch yields *"Could not find the 'created_by' column"*
  even though the SQL succeeded (on a different project).
- **Stale schema cache:** after DDL, PostgREST may keep serving the old schema.
  Force a reload with `notify pgrst, 'reload schema';` in the SQL Editor, or
  **Settings → General → Restart project**.
