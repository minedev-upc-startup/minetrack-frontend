# MineTrack — Conventions

This document defines the rules every contributor must follow.
The Layer 1 owner reviews against this document. PRs that break these rules will be rejected with a link to the relevant section, no debate.

If you disagree with a rule here, open a discussion to update *this document* before opening a PR that breaks it.

---

## 1. Architecture — Bounded contexts and layers

### 1.1 Folder structure

Every bounded context lives directly under `src/` and uses exactly four layers:

```
src/<context>/
├── domain/
│   └── model/             # Entities, Commands, Value Objects (plain JS)
├── application/           # Pinia stores — orchestrate use cases
├── infrastructure/        # API gateway (extends BaseApi), Assemblers
└── presentation/
    ├── components/        # Reusable Vue components scoped to this context
    ├── views/             # Route-level Vue components
    └── <context>-routes.js
```

### 1.2 Layer dependency direction (hard rule)

```
presentation → application → infrastructure
                           → domain
domain has zero imports from any other layer.
```

Concretely:

- **Domain files must not import** Vue, Pinia, Axios, the router, i18n, PrimeVue, or any sibling layer.
  - If you need `ref` or `computed`, you're in the wrong layer.
- **Infrastructure files must not import** Vue, Pinia, the router, or any presentation file.
- **Presentation files must not import** Axios directly. They go through the store.
- **No `application` file from one context may import an `application` file from another context.** Cross-context coordination happens at the presentation layer (e.g., a view reads from two stores) or via the shared `iam.store` for identity.

If you violate this, the reviewer will reject the PR.

### 1.3 What goes in `shared/`

`shared/` is for things that **every** bounded context needs and that have no business meaning of their own. Today that means:
- `BaseApi`, `BaseEndpoint`
- The `role-guard` route helper
- The app shell (layout, footer, language switcher)
- Common views: home, about, 404, 403

`shared/` is **not** a junk drawer. Domain logic does not go here. If you find yourself adding a Machine-related helper to `shared/`, it belongs in the `catalog/` context.

---

## 2. Naming

| Element                | Convention                       | Example                              |
|------------------------|----------------------------------|--------------------------------------|
| File names             | `kebab-case.kind.ext`            | `rental-request.entity.js`           |
| Folder names           | `kebab-case`                     | `rental-requests/`                   |
| Class names            | `PascalCase`                     | `RentalRequest`, `CatalogApi`        |
| Functions / variables  | `camelCase`                      | `submitRentalRequest`, `isLoading`   |
| Pinia store hook       | `useXxxStore`                    | `useRentalsStore`                    |
| Store ID (`defineStore`)| context name in lower kebab     | `'rentals'`, `'catalog'`             |
| Vue route names        | `<context>-<action>`             | `catalog-machine-detail`             |
| i18n keys              | `<context>.<area>.<key>`         | `catalog.list.title`                 |
| Env vars               | `VITE_<RESOURCE>_ENDPOINT_PATH`  | `VITE_MACHINES_ENDPOINT_PATH`        |
| PrimeVue components    | always `pv-` prefix              | `<pv-button>`, `<pv-data-table>`     |

### File-suffix vocabulary

Use these suffixes to make the layer of any file obvious from its name:

- `*.entity.js` — domain entity (DDD)
- `*.command.js` — domain command (DDD)
- `*.api.js` — infrastructure API gateway
- `*.assembler.js` — infrastructure assembler
- `*.store.js` — application store
- `*-list.vue`, `*-form.vue`, `*-detail.vue` — presentation views
- `*-routes.js` — presentation routes file

---

## 3. Routing

### 3.1 Manual route registration (no auto-loaders)

Every new bounded context registers its routes **explicitly** in `src/router.js`:

```js
import catalogRoutes from './catalog/presentation/catalog-routes.js';

const routes = [
  { path: '/catalog', name: 'catalog', children: catalogRoutes },
  // ...
];
```

Do not introduce `import.meta.glob`-based auto-loaders. We've decided one source of truth for "which contexts exist" is `router.js`, and we're keeping it that way.

### 3.2 Route meta contract

Every route declares its access policy via `meta`:

```js
{
  path: 'machines',
  name: 'catalog-machines',
  component: machineList,
  meta: {
    title: 'Machines',          // shown in the document title
    requiresAuth: true,         // omit or false → public route
    roles: ['Owner', 'Client']  // omit → any authenticated user
  }
}
```

Rules:

- `meta.requiresAuth` omitted **or** `false` → public route. Anyone may access.
- `meta.requiresAuth: true` and `meta.roles` omitted → any authenticated user.
- `meta.requiresAuth: true` and `meta.roles: [...]` → only authenticated users whose role is in the list.

The two guards (`authenticationGuard`, `roleGuard`) are wired into `router.beforeEach` in `router.js`. **Don't add a third guard** — extend the existing two if you need new behavior.

### 3.3 What happens on rejection

- Unauthenticated user hits `requiresAuth: true` → redirected to `iam-sign-in` with `?returnTo=<original-path>`.
- Authenticated user hits a route their role can't access → redirected to `/forbidden`.
- Token expires mid-session → not handled in TB1. Sign-out is manual via the topbar.

---

## 4. The fake API (`server/db.json`)

### 4.1 Schema is owned by the Layer 1 reviewer

Adding, renaming, or restructuring a top-level collection in `server/db.json` requires PR review by the Layer 1 owner. This is non-negotiable: a teammate silently changing `rental.startDate` from ISO string to Unix timestamp breaks every other context.

### 4.2 Resource-shape rules

- **`id`** is always a positive integer. json-server assigns it on POST.
- **Foreign keys** use the `<entity>Id` suffix (e.g., `ownerId`, `machineId`, `rentalRequestId`).
- **Dates and timestamps** are ISO-8601 strings.
  - Date-only fields (start/end of a rental window): `"2026-05-15"`
  - Datetime fields (created/handed off/closed): `"2026-05-04T10:30:00Z"` — always UTC, always with the `Z`.
- **Money** is a JS number expressed in PEN (Peruvian soles). Do not store currency strings.
- **Status enums** are PascalCase strings, never integers.
  - Machine status: `"Available"`, `"Rented"`, `"Under Maintenance"`
  - Rental request status: `"Pending"`, `"Approved"`, `"Rejected"`
  - Rental status: `"Approved"`, `"Active"`, `"Closed"`

### 4.3 Adding a new collection

Open a PR that adds:
1. The new collection in `server/db.json` (with at least 3 seeded records).
2. The endpoint env var in both `.env.development` and `.env.production`.
3. A short note in the PR description: collection name, fields, foreign keys.

Do not bypass step 2. The whole API URL system relies on env vars, not hard-coded paths.

---

## 5. State management (Pinia)

- One store per bounded context. If a context grows enough to need a second store, talk to the reviewer first.
- Stores expose **state, computed, and actions** — no internal helpers as exports.
- Actions that hit the API are `async` and use `try/catch`. Errors push into `errors.value`, not `throw`.
- Stores **do not** call `router.push` from outside an action that explicitly receives `router` as a parameter (the IAM store does this — follow that pattern).
- Reactive state (`ref`, `computed`) lives in the store. Views use `toRefs` to consume it.

---

## 6. Components and views

- Every PrimeVue component is registered globally with the `pv-` prefix (see `main.js`). Use `<pv-button>`, never `<Button>`.
- Don't import design tokens by hex value. Reference the CSS variables from `style.css` (`var(--mt-color-primary)`).
- `<style scoped>` is the default. Global styles go in `style.css` and require reviewer sign-off.
- All user-facing strings go through `t('...')` — no hard-coded English in templates. The reviewer will run a quick regex check before merge.

---

## 7. Internationalization

- Two locales: `en` (default) and `es`. Both are kept in sync.
- Keys are namespaced by bounded context: `catalog.list.title`, `rentals.form.submit`.
- A new key added to `en.json` must also be added to `es.json` in the same PR. Missing keys block merge.
- Don't put data values (machine names, user names) in locale files. Locales are for static UI strings only.

---

## 8. Authentication and tokens

- The IAM store writes the JWT to `localStorage` under the key `token`.
- The current user object is mirrored under `localStorage.currentUser`.
- The Axios request interceptor in `BaseApi` attaches `Authorization: Bearer <token>` automatically. **Do not** set this header manually in a context API class.
- Don't read `localStorage` directly from a view or component. Always go through `useIamStore()`.

When the C# backend ships, only `iam-api.js` and possibly `iam.store.js` change. Every other context keeps working unchanged.

---

## 9. Git workflow

### 9.1 Branching

GitFlow with the following branches:

- `main` — release-ready. Only merged from `develop` at TB1 / TB2 milestones. Tagged.
- `develop` — integration branch. Default branch for PRs.
- `feature/<context>-<short-description>` — one feature, one branch.
  - `feature/catalog-machine-list`
  - `feature/rentals-approve-flow`
- `fix/<context>-<short-description>` — bug fixes.
- `chore/<short-description>` — tooling, docs, dependency bumps.

Never push to `main` or `develop` directly. Always go through a PR.

### 9.2 Conventional Commits

Every commit message follows the [Conventional Commits](https://www.conventionalcommits.org/) spec:

```
<type>(<scope>): <short description>
```

Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`.
Scope: the bounded context name (`catalog`, `rentals`, `iam`, `iot`, `shared`, `infra`).

Examples:

- `feat(catalog): add machine availability calendar to detail view`
- `fix(rentals): reject closure when return reading < handoff`
- `chore(infra): bump axios to 1.15.2`
- `docs(conventions): clarify role-guard behavior`

### 9.3 Pull requests

Each PR must:

1. Target `develop` (never `main`).
2. Be linked to the user story it implements (`Closes US06` in the description).
3. Have a description with: what changed, why, how to verify, screenshots if UI.
4. Pass `npm run build` locally before opening.
5. Include both `en` and `es` locale updates if any UI strings changed.
6. Be reviewed by the Layer 1 owner before merge.

PRs that touch `server/db.json`, `router.js`, `shared/`, or `_template/` require explicit Layer 1 owner approval — no exceptions, even if another teammate already approved.

---

## 10. What the Layer 1 reviewer will reject on sight

This is not exhaustive, but these are the patterns that come back over and over:

- Importing `axios` from inside a view or store
- Importing Vue (`ref`, `computed`, `onMounted`) from inside a domain or infrastructure file
- A store action that swallows an error silently (no `errors.value.push`, no log)
- A new collection in `db.json` without an env var
- A hard-coded English string in a template
- A new top-level route registered without `meta.title`
- A PrimeVue component used without the `pv-` prefix
- A commit on `develop` without going through a PR
- A commit message that doesn't follow Conventional Commits
- "Just one tiny `localStorage` read" inside a view

---

## 11. When in doubt

- Read `src/iam/` end-to-end. It is the canonical example of a bounded context done right.
- If `iam` doesn't answer your question, read `src/_template/`.
- If neither does, ask the Layer 1 owner before writing the code, not after.
