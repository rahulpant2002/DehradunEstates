# DehradunEstates — Frontend

React + TypeScript + Vite single-page app for the DehradunEstates marketplace.
It talks directly to Supabase (Postgres/Auth/Storage) using the project URL and
public key — there is no intermediate API server.

See the [root README](../README.md) for the project overview and the
[backend README](../backend/README.md) for the database.

## Prerequisites
- Node.js 18+
- A Supabase project with the schema applied (see backend README)

## Setup
```bash
cp .env.example .env     # fill in the values below
npm install
npm run dev
```

### Environment variables (`.env`)
| Variable | Where to find it |
|----------|------------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → your project → Settings → Data API → **API URL** (e.g. `https://<ref>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Settings → **API Keys** → the `anon`/`public` key (`eyJ…`) **or** the **Publishable key** (`sb_publishable_…`) |

> Vite reads `.env` **only at startup** — restart `npm run dev` after changing it.
>
> ⚠️ The `VITE_SUPABASE_URL` project must be the **same** Supabase project where the
> SQL was applied, or you'll get "schema cache" errors. The key is a public client
> key (safe in the browser); never put the `service_role`/secret key here.

## Scripts
| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server (default http://localhost:5173) |
| `npm run build` | Type-check + production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Structure
```
src/
├── App.tsx              ← routes + auth-gated route guards
├── pages/               ← Home, Properties, Search, PropertyDetail, Auth, Sell, MyListings, MyInterests
├── components/          ← Header, Footer, PropertyCard, PropertyMap, SearchFilters
├── stores/              ← Zustand: useAuthStore, usePropertyStore, useThemeStore
├── lib/                 ← supabase.ts (client), constants.ts, utils.ts
├── hooks/               ← useDebounce, useGeolocation
└── types/               ← shared TypeScript types
```

## How data flows
- **State**: Zustand stores wrap all Supabase calls (`usePropertyStore`, `useAuthStore`).
- **Auth**: email sign-in/up via Supabase Auth; the session drives route guards in `App.tsx`.
- **Reads** (browse/search/detail) are public; **writes** (list/delete/express interest)
  require auth and are restricted server-side by Row Level Security.
- **Media**: uploaded to Supabase Storage buckets `property-photos` / `property-videos`;
  the public URLs are stored in `property_media`.

## Tech
React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router · React-Leaflet · lucide-react
