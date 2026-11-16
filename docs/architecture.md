# Architecture Overview

Next.js (App Router) frontend with Supabase (Postgres, Auth, Storage) as the only backend.
No API routes or other backends live in this repository. Business rules that must not be
bypassed (approvals, attendance, reports) are Postgres functions called through RPC, and data
access is limited by Row Level Security.

For a walkthrough in Indonesian, including a glossary of names, see `docs/panduan-kode.md`.

## Layers

```
UI (app/ routes, components/)        -> renders pages, uses hooks only
  │
Feature hooks (features/*/hooks)     -> TanStack Query (useQuery / useMutation),
  │                                     structured query keys, invalidation
Services (features/*/services)       -> wrap Supabase queries and RPC, map rows to
  │                                     camelCase types, normalize errors to ApiError
Supabase clients (lib/supabase/)     -> browser client, server client, proxy session helper
  │
Supabase                             -> Postgres + RLS, RPC functions, Auth, Storage,
                                        Edge Functions (admin-create-user, admin-delete-user)
```

- **Server state**: TanStack Query only. Never copied into Zustand.
- **Client/UI state**: Zustand (`stores/ui-store.ts`), e.g. sidebar collapsed/open.
- **Forms**: React Hook Form + Zod schemas in `features/*/schemas`.
- **Feedback**: `sonner` toasts via the shared `Toaster` in `AppProviders`.
- **Third-party APIs** (finance, SIAKAD; not integrated yet): `lib/axios.ts` only. Never used for Supabase.

## Auth and access control

1. `src/proxy.ts` runs first for every app route: refreshes the session cookies, redirects
   signed-out users to `/login`, and checks the route's permission (`config/permissions.ts`)
   with the `has_permission` RPC. New top-level routes must be added to its `matcher` and
   `PROTECTED_PREFIXES`.
2. `(dashboard)/layout.tsx` loads the current user (`getCurrentUser`) and redirects when the
   account is missing or inactive.
3. Each page calls `requirePermission(...)` on the server.
4. RLS and RPC checks in the database are the real enforcement; the three layers above are
   for navigation and user experience.

Login, logout, and password change are Server Actions (`features/auth/actions.ts`) on top of
`features/auth/services/auth-service.ts`.

## Rendering

- Cache Components and Partial Prefetching are enabled in `next.config.ts`.
- Pages read the session (cookies) before rendering, so they are dynamic.
  `(dashboard)/loading.tsx` is the Suspense boundary that keeps client navigations instant;
  `(dashboard)/error.tsx` and `app/not-found.tsx` handle failures.
- Feature panels are Client Components that fetch through hooks and show skeleton, empty,
  and error states.

## Folder structure

```
src/
  app/
    (auth)/login/           Login
    (dashboard)/            Shell (sidebar + header) and all signed-in pages
  components/
    ui/                     shadcn/ui primitives (Base UI)
    layout/                 Sidebar, header, PageContainer, PageHeader
    common/                 AppProviders, EmptyState, QueryErrorState, TableSkeleton, dialogs
  features/<module>/        components, hooks, schemas, services, types
  lib/                      supabase/, api-error.ts, query-client.ts, csv.ts, axios.ts, utils.ts
  stores/                   Zustand stores (UI state)
  config/                   env, routes, navigation, permissions, locale
  types/database.ts         Generated Supabase types
  proxy.ts                  Session refresh and route protection
supabase/
  migrations/               Schema, RLS, RPC functions (never edit an applied migration)
  functions/                Edge Functions that need the secret key
  seed.sql                  Roles, permissions, reference data
```

## Key decisions

- **Time zone**: dates and times use the campus zone (`app_settings.timezone`, WITA); see `config/locale.ts`.
- **Approvals**: HR only, always through RPC (`decide_*`, `execute_*`, `review_appraisal`, ...).
- **Attendance**: only through `check_in` / `check_out` with browser GPS; the radius check is done in the database.
- **Leaders** (chair, vice chair, quality assurance): aggregate statistics only, through `report_*` functions scoped by `report_scopes`.
- **Query client**: no retry on 4xx; `refetchOnWindowFocus` disabled; no optimistic updates.
- **Environment**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.example`). The secret key exists only inside Edge Functions.
