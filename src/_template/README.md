# Bounded Context Template

This folder is the starting point for every new bounded context in MineTrack.
Teammates own one bounded context end-to-end: domain, application, infrastructure, presentation.

## How to use this template

1. **Copy this folder** under `src/`, renaming it to your context (`catalog/`, `rentals/`, `iot/`, ...).
2. **Rename the placeholder files**:
   - `machine.entity.js` → your real entity (e.g., `machine.entity.js`)
   - `catalog-api.js`  → e.g., `catalog-api.js`
   - `catalog.store.js` → e.g., `catalog.store.js`
   - `catalog-routes.js` → e.g., `catalog-routes.js`
   - `example-list.vue`, `example-form.vue` → e.g., `machine-list.vue`, `machine-form.vue`
3. **Add a route entry** in `src/router.js` so your context is reachable:
   ```js
   import catalogRoutes from './catalog/presentation/catalog-routes.js';
   // ...
   { path: '/catalog', name: 'catalog', children: catalogRoutes },
   ```
4. **Add an endpoint env var** in `.env.development` and `.env.production`:
   ```
   VITE_MACHINES_ENDPOINT_PATH="/machines"
   ```
5. **Add a resource collection** to `server/db.json` (coordinate with the schema owner).
6. **Add i18n keys** to `src/locales/en.json` and `src/locales/es.json` under your context namespace:
   ```json
   "catalog": {
     "list": { "title": "Machines" },
     ...
   }
   ```
7. **Delete this README.md and `_template/`** once you've made the copy.

## What goes in each layer

| Layer            | Contents                                          | Rules                                            |
|------------------|---------------------------------------------------|--------------------------------------------------|
| `domain/`        | Entities, Commands, Value Objects                 | No Vue, no HTTP, no Pinia. Plain JS only.        |
| `application/`   | Pinia store(s) — orchestrate use cases            | Holds reactive state, calls API + Assembler.     |
| `infrastructure/`| API gateway (extends BaseApi), Assemblers         | Maps Resource ↔ Entity. Talks to HTTP.           |
| `presentation/`  | Views, components, routes file                    | Reads store; never imports Axios directly.       |

## Layer dependency direction

```
presentation  →  application  →  infrastructure
                               →  domain
domain has no imports from any other layer
```

If you import Vue from a domain file, or Axios from a view, you have broken the pattern.
The reviewer (Layer 1 owner) will flag and reject the PR.

## Naming conventions

| Type                   | Convention                  | Example                          |
|------------------------|-----------------------------|----------------------------------|
| Files                  | `kebab-case.kind.ext`       | `rental-request.entity.js`       |
| Classes                | `PascalCase`                | `RentalRequest`                  |
| Functions / variables  | `camelCase`                 | `submitRentalRequest`            |
| Pinia store hook       | `useXxxStore`               | `useRentalsStore`                |
| Route names            | `<context>-<action>`        | `catalog-machine-detail`         |
| i18n keys              | `<context>.<area>.<key>`    | `catalog.list.title`             |
| Test data / seed users | `<role>@minetrack.app`      | `carlos@minetrack.app`           |
