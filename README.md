# DehradunEstates 🏡

An open **property marketplace** for Dehradun. Anyone can sign up, **list** their
properties (with photos & videos), browse everyone's listings, and **express
interest** in a property — which notifies the seller and shows them the
interested buyer's contact details.

> Monorepo with two parts: a **React frontend** and a **Supabase backend**
> (hosted Postgres + Auth + Storage). There is no separate server process to run —
> the "backend" is SQL you apply to a Supabase project.

---

## Features

- 🔎 **Browse & search** all listings (filters: type, price, bedrooms, furnishing) — public, no login.
- 🗺️ **Map view** of properties (Leaflet / OpenStreetMap).
- 📝 **Sell / list** a property with **image & video upload** (any signed-in user).
- 🤝 **Express interest** ("Buy") — the seller is notified and sees who's interested, with contact info.
- 📋 **My Listings** (your properties + their interested buyers) and **My Interests** (properties you liked).
- 🔐 **Email auth**, with **ownership-based security enforced in the database** (Row Level Security), not just the UI.
- 🌗 Light/dark theme.

## Tech stack

| Layer     | Tech |
|-----------|------|
| Frontend  | React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Router, React-Leaflet, lucide-react |
| Backend   | Supabase — Postgres, Auth, Storage, Row Level Security, RPC functions |

## Project structure

```
RealState/
├── README.md              ← you are here (project overview + setup)
├── docs/                  ← full project documentation (SRS, architecture, DB, dev log)
├── backend/               ← Supabase backend (SQL only — no server)
│   ├── README.md          ← schema, RLS, storage, setup details
│   └── supabase/
│       ├── migrations/    ← 0001…0005 (schema, functions, policies, storage, interests)
│       ├── setup_all.sql  ← all migrations + seed, concatenated (one-paste setup)
│       ├── reset.sql      ← drops app objects for a clean rebuild
│       ├── fix.sql        ← non-destructive patch for an older schema
│       └── seed.sql       ← sample listings + media
└── frontend/              ← React + Vite single-page app
    ├── README.md          ← frontend dev notes
    ├── .env.example       ← Supabase URL + anon/publishable key
    └── src/
        ├── pages/         ← Home, Properties, Search, PropertyDetail, Auth, Sell, MyListings, MyInterests
        ├── components/    ← Header, Footer, PropertyCard, PropertyMap, SearchFilters
        ├── stores/        ← Zustand stores (auth, properties, theme)
        └── lib/           ← supabase client, constants, utils
```

---

## Getting started

### Prerequisites
- **Node.js** 18+ and npm
- A **Supabase project** (free tier is fine) — https://supabase.com

### 1. Set up the backend (database)
In your Supabase project's **SQL Editor**, run **`backend/supabase/setup_all.sql`** once
(it builds the schema, security rules, storage buckets, and seed data).
Full details and alternatives are in **[backend/README.md](backend/README.md)**.

### 2. Configure & run the frontend
```bash
cd frontend
cp .env.example .env        # then fill in your project's URL + anon/publishable key
npm install
npm run dev
```
Open the printed URL (default http://localhost:5173).
More in **[frontend/README.md](frontend/README.md)**.

### 📚 Full documentation
Detailed docs live in **[docs/](docs/)**:
[SRS](docs/01-SRS.md) · [Architecture](docs/02-ARCHITECTURE.md) · [Database](docs/03-DATABASE.md) · [Development Log](docs/04-DEVELOPMENT-LOG.md)

> ⚠️ **The single most important gotcha:** the Supabase **project** referenced in
> `frontend/.env` must be the **same project** where you ran the SQL. Mixing up two
> projects produces errors like *"Could not find the 'created_by' column"* even
> though the SQL "succeeded" — because it succeeded on a *different* project.
> Confirm the project ref in `frontend/.env`'s URL matches your dashboard URL.

---

## How it works (the marketplace flow)

1. **User A** signs in → **Sell Property** → fills the form, uploads photos/videos → listing goes live (`created_by = A`).
2. Everyone (even logged out) sees it under **Home → Latest Listings**, **Properties**, and **Browse**.
3. **User B** opens the listing → **Buy this Property** → an interest row is recorded.
4. **A** sees **B** (name, phone, email) under **My Listings → "N interested"**; **B** sees it under **My Interests**.

Security is enforced in Postgres via RLS: you can only insert/delete *your own*
listings and media, only buy *other people's* available listings, and a seller can
read the contact profile of users interested in *their* properties. See
[backend/README.md](backend/README.md) for the exact policies.

## Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home (featured + latest) | public |
| `/properties` | All listings | public |
| `/search` | Search + filters + map | public |
| `/property/:id` | Listing detail (Buy / Delete) | public (Buy needs login) |
| `/auth` | Sign in / Sign up | public |
| `/sell` | List a property | signed-in |
| `/my-listings` | Your listings + interested buyers | signed-in |
| `/my-interests` | Properties you're interested in | signed-in |

## Troubleshooting

- **"Could not find the 'X' column / table in the schema cache"** — the schema isn't on the project your app points to, *or* PostgREST's cache is stale. Fix: confirm `frontend/.env` targets the right project, (re)run the SQL there, then reload the cache (`notify pgrst, 'reload schema';` in SQL Editor, or **Settings → General → Restart project**).
- **Listing inserts fail** — make sure you're signed in (ownership is `created_by = auth.uid()`).
- **Images/map don't load** — they're fetched from the Pexels CDN / OpenStreetMap; needs internet.

## Scripts (frontend)

```bash
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview the build
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

## License

Private / educational project.
