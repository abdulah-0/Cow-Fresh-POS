# Structure

## Directory Map
- `src/app/`: Next.js App Router pages and layouts.
  - `(dashboard)/`: Group for authenticated dashboard routes.
    - `[tenant]/`: Tenant-specific dynamic routing.
    - `sales/`: POS Billing interface.
  - `login/`, `signup/`: Authentication pages.
- `src/components/`:
  - `ui/`: Shadcn-like reusable UI primitives.
  - `features/`: Module-specific components (customers, employees, items, sales, etc.).
  - `layout/`: Global layout elements.
- `src/lib/`: Shared utilities and Supabase client configuration.
- `src/store/`: Zustand store definitions (e.g., `cartStore.ts`).
- `src/types/`: TypeScript interface definitions.
- `src/hooks/`: Custom React hooks.
- `supabase/`: SQL setup scripts and migrations.
- `docs/`: Project documentation (PRD, etc.).
