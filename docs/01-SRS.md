# Property Listing Platform — Software Requirements Specification

**Version 1.0** · Domain: Real Estate / Property Management · Market: Dehradun (scalable across India)

Legend: ✅ Implemented · 🔜 Planned

---

## 1. Project Overview

The Property Listing Platform (**DehradunEstates**) is a full-stack web
application for discovering, listing, and showing interest in properties. The
delivered system is an **open peer-to-peer marketplace**: any registered user can
both **list (sell)** their own properties and **express interest (buy)** in
others' listings. Guests can browse everything without an account.

It supports **image and video uploads**, **location-based discovery** (map +
geolocation), and a **lead/interest** flow that notifies sellers of interested
buyers. The architecture is intentionally simple and serverless: a React
single-page app talking directly to **Supabase** (Postgres + Auth + Storage),
with all authorization enforced in the database via Row-Level Security.

---

## 2. Objectives

- ✅ Provide a modern property search & browse experience (filters, map).
- ✅ Let users list and manage their own properties efficiently.
- ✅ Enable discovery of nearby properties (geolocation + radius intent).
- ✅ Support property **images and videos**.
- ✅ Enforce strong, server-side access control (RLS) for scalability & safety.
- ✅ Offer light and dark themes.
- 🔜 Administrative moderation, analytics, and third-party integrations.
- 🔜 AI-powered recommendations and assistants.

---

## 3. User Roles

> **Design note.** The original SRS envisioned four roles (Guest, User, Dealer,
> Admin). The delivered product deliberately **collapses "User" and "Dealer" into
> a single registered user** — an open marketplace where everyone can both buy and
> sell — and **removes the Admin role** in favor of database-enforced ownership
> rules. The richer RBAC below is retained as a 🔜 future option.

### 3.1 Guest User — ✅
- Browse all properties
- Search & filter; map view
- View property details, images, and videos

### 3.2 Registered User (buyer **and** seller) — ✅
- Register / Log in / Log out
- **List** a property (with image/video upload)
- **Manage** their own listings (delete)
- **Express interest** ("Buy") in others' listings
- See **My Listings** (and who's interested in them) and **My Interests**
- Manage basic profile (name, phone captured at sign-up)

### 3.3 Property Dealer — 🔜
A future elevated role with bulk listing tools, lead pipelines, and analytics.
Currently every registered user already has core dealer capabilities.

### 3.4 Administrator — 🔜
A future role for user management, property moderation/approval, category
management, and platform analytics. (An admin model was prototyped and then
intentionally removed for the open-marketplace design.)

---

## 4. Functional Requirements

### 4.1 Authentication Module
- ✅ User registration (email + password)
- ✅ User login / logout
- ✅ Session management (JWT issued & managed by Supabase Auth/GoTrue)
- ✅ Email verification (toggleable; can auto-confirm)
- 🔜 Password reset flow in-app
- 🔜 Google / OAuth login, OTP login

### 4.2 Property Management Module
- ✅ Add property (with media)
- ✅ Delete property (owner only)
- ✅ Status field (`available` / `sold`)
- 🔜 In-app **edit** property (currently delete + re-list)
- 🔜 Property verification / approval workflow

**Property fields (implemented):** title, description, price, price type
(sale/rent), property type, status, address, city, locality, latitude,
longitude, area (sq.ft.), bedrooms, bathrooms, furnishing, featured flag, owner
(`created_by`), timestamps, plus related images & videos.

### 4.3 Search Module
- ✅ Search by title/locality (text)
- ✅ Filter by property type, price range, bedrooms, furnishing
- ✅ Map view of results
- ✅ Nearby intent via browser geolocation
- 🔜 True radius (distance) search server-side (PostGIS)
- ✅ Sorting by recency (newest first)

### 4.4 Media Management Module
- ✅ Multiple image uploads
- ✅ Video uploads
- ✅ Public delivery via Supabase Storage CDN
- ✅ Lazy-loaded images in lists
- 🔜 Server-side thumbnail generation & transcoding/optimization

### 4.5 Interest / Lead Management Module
- ✅ Express interest in a property ("Buy" button) — one per user per property
- ✅ Seller sees **all interested buyers** for their listing, **with contact details**
- ✅ Buyer sees their interests under **My Interests**
- 🔜 Lead status workflow (new → contacted → closed), messaging threads

### 4.6 Favorites Module — 🔜
Save / remove / list favorite properties. (Distinct from "interests"; not yet built.)

### 4.7 Analytics Module — 🔜
Property views, user activity, seller statistics, dashboards.

---

## 5. Non-Functional Requirements

### Performance
- ✅ Pagination on listings; indexed queries; lazy-loaded media.
- 🔜 Redis caching / Elasticsearch for very large datasets.
- Target (design): 1,000+ concurrent users, 5,000+ listings initially.

### Scalability
- ✅ Managed Postgres (Supabase) with appropriate indexes.
- 🔜 Scale path to 100k+ users / 1M+ records via caching, partitioning, search engine.

### Availability
- ✅ Runs on Supabase's managed infrastructure (provider SLA).
- Target: 99.9% uptime.

### Security
- ✅ Managed JWT auth (Supabase).
- ✅ **Row-Level Security** for authorization on every table (ownership-based).
- ✅ Secure, owner-scoped file uploads (storage policies).
- ✅ SQL-injection-safe access (PostgREST parameterization; no raw SQL from client).
- 🔜 API rate limiting, CSRF/XSS hardening at an app gateway, audit logging.

See [03-DATABASE.md](03-DATABASE.md) and [02-ARCHITECTURE.md](02-ARCHITECTURE.md)
for the concrete security model.
