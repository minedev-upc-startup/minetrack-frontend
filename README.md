# MineTrack

> B2B platform for the rental of heavy mining machinery.
> Two-sided marketplace where Owners list equipment, Clients (mining companies) request rentals, and a shared IoT layer monitors operating telemetry.

This repository contains the Vue 3 frontend for MineTrack, organized under a Domain-Driven Design (DDD) architecture with one bounded context per business area.

## Stack

- **Vue 3** + **Vite** + **Pinia** + **Vue Router** + **Vue I18n**
- **PrimeVue** + **PrimeFlex** + **PrimeIcons** (Material preset)
- **Axios** for HTTP
- **json-server** for the local fake API (TB1 deliverable)

The C# (ASP.NET Core) backend is delivered separately in TB2; this repo treats it as a black box behind the API contract documented under `server/db.json` and the env-var endpoint paths.

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Start the fake API (terminal 1)
npm run server
# → http://localhost:3000/api/v1

# 3. Start the frontend (terminal 2)
npm run dev
# → http://localhost:5173
```

### Demo accounts (seeded in `server/db.json`)

| Role   | Email                        | Password      |
|--------|------------------------------|---------------|
| Owner  | carlos@minetrack.app         | password123   |
| Owner  | sandra@minetrack.app         | password123   |
| Client | operations@minasdelsur.pe    | password123   |
| Client | logistics@andesmining.pe     | password123   |

You can also create a new account from `/iam/sign-up`.

## Project layout

```
minetrack/
├── server/                           # Fake API (json-server)
│   ├── db.json                       # Seed data — schema source of truth
│   ├── routes.json                   # /api/v1/* prefix mapping
│   └── start.sh
├── src/
│   ├── App.vue, main.js, router.js, pinia.js, i18n.js, style.css
│   ├── locales/                      # i18n EN + ES, namespaced per context
│   ├── shared/                       # Cross-context infrastructure + UI shell
│   │   ├── infrastructure/           #   BaseApi, BaseEndpoint, role-guard
│   │   └── presentation/             #   Layout, language switcher, common views
│   ├── iam/                          # Auth bounded context (full reference)
│   │   ├── domain/                   #   User entity, SignIn/SignUp commands
│   │   ├── application/              #   iam.store
│   │   ├── infrastructure/           #   IamApi, assemblers, guard
│   │   └── presentation/             #   sign-in / sign-up forms, routes
│   ├── _template/                    # Starter copy for each new context
│   └── <your-context>/               # ← teammates copy _template here
└── README.md, CONVENTIONS.md
```

## Adding a new bounded context

Read `src/_template/README.md` and follow the steps. The short version:

1. Copy `_template/` → `<your-context>/`
2. Rename placeholder files
3. Register your routes in `src/router.js`
4. Add your endpoint env var to `.env.development` + `.env.production`
5. Add your collection to `server/db.json` (coordinate with schema owner)
6. Add i18n keys to `locales/en.json` + `locales/es.json`

## Conventions

Read `CONVENTIONS.md` before opening any PR. The reviewer (Layer 1 owner) will reject PRs that break the layer pattern.

## Course

UPC — 1ASI0730 Aplicaciones Web — Cycle 5 — 2026-1
