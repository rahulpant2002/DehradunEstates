# Development Log & Decisions

A chronological record of how the project evolved, the key decisions made, and
the lessons learned. Useful for understanding *why* the code looks the way it
does — and for not repeating the painful bits.

---

## Timeline (request → outcome)

| # | Request / goal | What was done |
|---|----------------|---------------|
| 1 | **Photos/videos not showing after updating a property** | Root cause: `PropertyForm` initialized state (incl. existing media) with `useState(property…)`, which never re-syncs when the async-loaded property changes. Fixed by gating the form until the correct property loads and keying it by id. |
| 2 | **Restructure repo** | Moved the whole app into a `frontend/` folder to make room for a backend; had to stop a running Vite dev server that was locking `src/`. |
| 3 | **"Delete isn't working; I haven't made a backend"** | Clarified that **Supabase already *is* the backend**. Delete was silently blocked by RLS while the UI optimistically removed the row. |
| 4 | **"Make it a static site with dummy photos, no backend"** | Stripped Supabase entirely; served listings from an in-memory dataset with Pexels images; removed auth/admin/CRUD pages. |
| 5 | **"Now build the real backend (Supabase), users buy / admin add-delete, media upload, optimal DB"** | Created the `backend/` folder: schema, RLS, storage, seed; re-wired the frontend to Supabase; added auth, admin panel, buy flow, media upload. |
| 6 | **"Reframe: central marketplace, everyone buys/sells, no admin"** | Replaced role-based access with **ownership-based** RLS; removed the admin role/pages; added Sell + My Listings; any user can list and buy. |
| 7 | **"Show listings to logged-out users"** | Added a **Latest Listings** section on Home and a dedicated public **/properties** dashboard. |
| 8 | **"Buy should notify the seller of interested buyers"** | Added the `property_interests` table + RLS; "Buy" now records interest; sellers see interested buyers (with contact) in **My Listings**; buyers see **My Interests**. |
| 9 | **Persistent "Could not find 'created_by'…schema cache" error** | Long debugging (see below). Root cause: **the app pointed to a different Supabase project than where the SQL was applied.** |
| 10 | **Auth operations** | Counting users, deleting a user, adding a pre-verified user, and disabling email confirmation — all via the Supabase dashboard (admin-only actions). |
| 11 | **Docs & hardening** | Root/frontend/backend READMEs, a root `.gitignore`, a security review for GitHub, and this `docs/` set. |

---

## Major decisions & rationale

- **BaaS over a custom server.** Supabase (Postgres + Auth + Storage + auto API)
  removed the need for a NestJS tier for the MVP. The richer stack
  (NestJS/Redis/Cloudinary/Mapbox) is documented as the **scaling roadmap**, not
  the current build. See [02-ARCHITECTURE.md](02-ARCHITECTURE.md).
- **Ownership-based RLS instead of an Admin role.** For an open marketplace,
  "you can only touch your own rows" (`created_by = auth.uid()`) is simpler and
  safer than a privileged admin. Admin/moderation remains a future option.
- **Interests instead of one-click purchase.** Real estate is lead-driven; many
  buyers can be interested in one property. So "Buy" creates a
  `property_interests` lead (notifying the seller) rather than instantly
  transferring/selling. The old `purchases` table is kept but dormant.
- **Public read, locked-down writes.** Browsing is public (no login) to maximize
  discovery; every write is constrained server-side by RLS.

---

## Lessons learned (the expensive ones)

### 1. The app must point at the *same* Supabase project the SQL was applied to
The single biggest time sink: the SQL Editor kept confirming the schema was
correct (`created_by` present, 6 rows), yet the app and API insisted
`created_by` didn't exist. The cause was a **project mismatch** — the SQL was run
on project `…nwwaqxia…` while `frontend/.env` pointed at a *different* project
`…ftqru…`. Every "reload" and "restart" was being applied to the wrong project.

**Takeaway:** verify the project ref in `frontend/.env`'s URL matches the
dashboard URL (`/project/<ref>/…`) before debugging anything schema-related.

### 2. PostgREST caches the schema
After DDL, the REST API can keep serving the *old* schema, producing
"…in the schema cache" errors even when the table/column exists. Fixes:
`notify pgrst, 'reload schema';` in the SQL Editor, or **Settings → General →
Restart project**.

### 3. The anon/publishable key is *public*
It ships in the browser bundle by design. Security therefore depends entirely on
**RLS**, not on hiding the key. The `service_role` key must never reach the
client or the repo.

### 4. `create table if not exists` won't fix an old table
Re-running migrations does nothing to a table that already exists with the wrong
columns. To change an existing schema you must `reset.sql` (rebuild) or
`fix.sql` (ALTER in place).

### 5. RLS makes failures look like success
A blocked `delete`/`insert` can return *no error* (zero rows affected) while the
UI optimistically updates — so it "works" until a refresh. Check affected rows,
and remember RLS returns empty sets rather than errors.

---

## Known gaps / next steps

- 🔜 In-app **edit** listing (currently delete + re-list).
- 🔜 **Favorites**, **password reset**, **OAuth/OTP** login.
- 🔜 **Analytics** & seller dashboards; lead status workflow + messaging.
- 🔜 **Email/WhatsApp notification** to sellers on new interest (needs an Edge Function).
- 🔜 Media **thumbnails/transcoding**, true **radius search** (PostGIS), caching/search engine at scale.
- 🔜 Re-enable email confirmation and add rate limiting for production.
