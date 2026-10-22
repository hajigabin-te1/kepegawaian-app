# Architecture Overview (Stage 1)

Frontend-only Next.js (App Router) client for the existing employee API.
No backend, database, or API routes are created in this repository.

## Layers

```
UI (app/ routes, components/)        -> renders pages, uses hooks only
  │
Feature hooks (features/*/hooks)     -> TanStack Query (useQuery / useMutation)
  │                                     structured query keys, invalidation
Services (features/*/services)       -> one function per API endpoint, typed
  │
HTTP client (lib/axios.ts)           -> base URL, Authorization header,
                                        error normalization (ApiError), 401 handling
  │
Existing employee API (external)
```

- **Server state** (employee data): TanStack Query only. Never copied into Zustand.
- **Client/UI state**: Zustand (`stores/`), e.g. mobile sidebar open state and in-memory session token.
- **Forms**: React Hook Form + Zod schemas in `features/*/schemas` (Stage 2+, after the API contract is confirmed).
- **Feedback**: `sonner` toasts via the shared `Toaster` in `AppProviders`.

## Folder structure

```
src/
  app/
    (auth)/login/                 Login page (placeholder)
    (dashboard)/                  Dashboard shell: sidebar + header
      dashboard/                  Dashboard (placeholder)
      employees/                  Employee list (placeholder)
      employees/new/              Create employee (placeholder)
      employees/[id]/             Employee detail (placeholder)
      employees/[id]/edit/        Edit employee (placeholder)
    layout.tsx                    Root layout + AppProviders
    page.tsx                      Redirects to /dashboard
  components/
    ui/                           shadcn/ui primitives (Base UI)
    layout/                       AppSidebar, MobileSidebar, AppHeader, PageContainer, PageHeader
    common/                       AppProviders, PlaceholderNotice
  features/
    employees/{components,hooks,schemas,services,types}
    auth/{components,hooks,schemas,services,types}
  lib/                            axios.ts, api-error.ts, query-client.ts, utils.ts
  stores/                         auth-store.ts, ui-store.ts (Zustand)
  types/                          Shared types
  config/                         env.ts, routes.ts, navigation.ts
```

## Key decisions

- **Responsive shell**: persistent sidebar from `lg` (≥1024px); below that a left `Sheet` drawer opened from the header.
- **Route params** (`/employees/[id]`) are read inside a `<Suspense>` boundary because Cache Components is enabled in `next.config.ts`.
- **Query client**: one per server render, singleton in the browser; no retry on 4xx; `refetchOnWindowFocus` disabled.
- **401 handling**: clear the in-memory session and redirect to `/login`. Will be revisited once the auth flow (refresh token, cookie vs bearer) is confirmed.
- **Environment**: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_API_TIMEOUT_MS` (see `.env.example`).

## Next stages (pending API contract confirmation)

1. Auth: login form, token storage, route protection, logout.
2. Employee types + services + query hooks.
3. Employee list (table, search, filter, pagination, skeleton/empty/error states).
4. Create / edit forms (RHF + Zod), detail view, delete with confirmation dialog.
