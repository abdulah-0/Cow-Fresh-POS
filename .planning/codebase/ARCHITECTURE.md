# Architecture

## High-Level Overview
The project is a **Multi-tenant SaaS POS System**. It uses a modern server-client architecture leveraging Next.js App Router and Supabase.

## Pattern & Design
- **Multi-tenancy**: Every table includes a `tenant_id`. Access is scoped via Supabase Row Level Security (RLS) and middleware.
- **Client-Side State**: Zustand is used for complex client-side state like the POS Cart (`cartStore.ts`).
- **Data Access**: Mixture of Client Components (with `use client`) and Server Middleware for auth checks.
- **Component Pattern**: Uses a layered approach:
  - `ui`: Atomic Shadcn-like components (Radix + Tailwind).
  - `features`: Domain-specific components (sales, items, customers).
  - `layout`: Shared layout components (navbar, sidebar).

## Authentication & Authorization
- **Auth**: Supabase Auth (Email/Password).
- **Roles**: Custom role-based access control (Admin, Manager, Cashier) defined in the `roles` and `employees` tables.
