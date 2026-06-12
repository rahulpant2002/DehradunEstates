# Architecture & Technology

Legend: ✅ As built · 🔜 Recommended / future

---

## 1. High-level architecture (as built)

The platform is a **serverless, BaaS-backed SPA** — there is no custom
application server. The React app speaks directly to Supabase's auto-generated
APIs, and **all authorization lives in the database** (Row-Level Security).

```
┌──────────────────────────────────────────────────────────┐
│  Browser — React SPA (Vite build, static hosting)         │
│  Zustand stores · React Router · Tailwind · React-Leaflet │
└───────────────┬──────────────────────────────────────────┘
                │  @supabase/supabase-js  (HTTPS, anon/publishable key)
                ▼
┌──────────────────────────────────────────────────────────┐
│  Supabase (managed cloud)                                 │
│   ├─ GoTrue        → Auth (email/password, JWT)           │
│   ├─ PostgREST     → REST API over Postgres               │
│   ├─ Storage       → property-photos / property-videos    │
│   └─ Postgres 15   → tables + RLS + RPC functions         │
└───────────────┬──────────────────────────────────────────┘
                ▼
        Public CDN delivery (Storage public URLs)
        OpenStreetMap tiles (maps) · Pexels CDN (sample media)
```

Key idea: the **anon/publishable key is public** (it ships in the browser
bundle). Security is **not** based on hiding it — it's enforced by RLS policies
in Postgres. See [03-DATABASE.md](03-DATABASE.md).

---

## 2. Technology stack

### 2.1 As built ✅

| Layer | Technology | Notes |
|-------|------------|-------|
| UI framework | **React 18 + TypeScript** | function components, hooks |
| Build tool | **Vite 5** | fast dev server + static build |
| Styling | **Tailwind CSS 3** | utility-first, light/dark theme |
| State | **Zustand** | small stores wrapping Supabase calls |
| Routing | **React Router 7** | route guards for auth-only pages |
| Maps | **React-Leaflet + OpenStreetMap** | free tiles, no key |
| Icons | **lucide-react** | |
| Auth | **Supabase Auth (GoTrue)** | email/password, managed JWT |
| API | **Supabase / PostgREST** | auto REST from schema |
| Database | **PostgreSQL 15 (Supabase)** | RLS + RPC |
| Storage | **Supabase Storage** | public buckets for media |

### 2.2 Recommended for scale 🔜
*(from the original SRS — the growth path, not the current build)*

| Concern | Future option |
|---------|---------------|
| Dedicated API tier | **NestJS + TypeScript** (modular, DI) in front of/around Supabase |
| Caching | **Redis / Upstash** for hot searches & sessions |
| Media | **Cloudinary** then **AWS S3 + CloudFront** (optimization, transcoding) |
| Maps | **Mapbox** (richer styling) |
| Search | **Elasticsearch** for large-scale full-text / geo search |
| AI | Recommendation engine, AI descriptions, chatbot assistant |

> Trade-off rationale: Supabase delivers Postgres + Auth + Storage + a secure API
> with almost no backend code, which is ideal for an MVP. The NestJS/Redis/Cloud­
> inary stack is the right move only once traffic, media volume, or custom
> business logic outgrow the BaaS model.

---

## 3. Frontend structure

```
frontend/src/
├── App.tsx            routes + auth-gated guards (RequireAuth)
├── pages/             Home, Properties, Search, PropertyDetail, Auth, Sell,
│                      MyListings, MyInterests
├── components/        Header, Footer, PropertyCard, PropertyMap, SearchFilters
├── stores/            useAuthStore, usePropertyStore, useThemeStore (Zustand)
├── lib/               supabase.ts (client), constants.ts, utils.ts
├── hooks/             useDebounce, useGeolocation
└── types/             shared TypeScript types
```

### Routes

| Path | Page | Access |
|------|------|--------|
| `/` | Home (featured + latest) | public |
| `/properties` | All listings dashboard | public |
| `/search` | Search + filters + map | public |
| `/property/:id` | Listing detail (Buy / Delete) | public; Buy needs login |
| `/auth` | Sign in / Sign up | public |
| `/sell` | Create a listing | signed-in |
| `/my-listings` | Your listings + interested buyers | signed-in |
| `/my-interests` | Properties you're interested in | signed-in |

---

## 4. Core data flows

**Listing a property (sell)**
1. Authenticated user submits the Sell form.
2. App inserts a `properties` row with `created_by = auth.uid()` (RLS-checked).
3. Files upload to Storage at `"<property_id>/<type>_<ts>_<i>.<ext>"`.
4. Public URLs are saved as `property_media` rows.

**Expressing interest (buy)**
1. A non-owner clicks **Buy this Property**.
2. App inserts a `property_interests` row (`unique(property_id, user_id)`).
3. The **seller** can read those rows for their listings **and** the interested
   buyer's contact profile (via a dedicated `profiles` SELECT policy).
4. Buyer sees it in **My Interests**; seller sees "N interested" in **My Listings**.

---

## 5. Deployment

### As built ✅
- **Frontend:** static build (`npm run build` → `dist/`) hosted on **Vercel**
  or **Netlify**. Environment: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
- **Backend:** **Supabase** managed project (Postgres + Auth + Storage). Schema
  applied via SQL Editor (`backend/supabase/setup_all.sql`).

### Future 🔜
- NestJS API on Railway/Render → AWS ECS (Docker).
- Neon Postgres / Upstash Redis if moving off Supabase-managed services.

> **Critical deployment rule:** the Supabase **project** in `frontend/.env` must be
> the same project the SQL was applied to. A mismatch produces *"Could not find the
> 'created_by' column"* even when the SQL succeeded — because it succeeded on a
> *different* project. (This actually happened during development — see
> [04-DEVELOPMENT-LOG.md](04-DEVELOPMENT-LOG.md).)

---

## 6. Performance techniques

- ✅ Pagination (page size 20), newest-first ordering.
- ✅ Database indexes on status, type, price, price_type, created_at, created_by, featured.
- ✅ Lazy-loaded list images; map tiles loaded on demand.
- ✅ Debounced search input.
- 🔜 Redis caching, infinite scroll, image/video optimization, CDN tuning, Elasticsearch.
