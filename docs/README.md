# Property Listing Platform — Documentation

> Product name in code: **DehradunEstates**. Domain: Real Estate / Property
> Management. Initial market: Dehradun, Uttarakhand, India.

This folder is the **single source of project documentation**, kept at the repo
root alongside [`frontend/`](../frontend) and [`backend/`](../backend).

## Contents

| Doc | What's inside |
|-----|---------------|
| [System Prompt.md](System%20Prompt.md) | The original **Software Requirements & Architecture Document (v1.0)** — the source spec/brief that seeded the project (recommended/aspirational stack and roles). |
| [01-SRS.md](01-SRS.md) | Software Requirements Specification — overview, objectives, **user roles**, functional & non-functional requirements. Each item is tagged ✅ implemented / 🔜 planned. |
| [02-ARCHITECTURE.md](02-ARCHITECTURE.md) | System architecture, **technology stack (as built vs. recommended-future)**, data flow, deployment, performance. |
| [03-DATABASE.md](03-DATABASE.md) | The actual database — tables, enums, ER diagram, **Row-Level-Security model**, functions, storage. |
| [04-DEVELOPMENT-LOG.md](04-DEVELOPMENT-LOG.md) | How the project evolved (the build journey), key decisions, and **lessons learned** (incl. the Supabase project-mismatch debugging). |

## How to read this

- The **code is the source of truth.** These docs describe the system **as
  actually implemented** (a React SPA on a Supabase backend), and explicitly
  separate that from the **future/recommended** architecture (NestJS, Redis,
  Cloudinary, Mapbox, AI) so the document stays honest.
- Legend used throughout:
  - ✅ **Implemented** — working in the current codebase.
  - 🔜 **Planned** — designed/roadmapped, not yet built.

## Quick links

- Project overview & setup: [root README](../README.md)
- Backend (schema/RLS/storage): [backend/README.md](../backend/README.md)
- Frontend (dev/env/scripts): [frontend/README.md](../frontend/README.md)

---

*Version 1.0 — generated from the project as built.*
