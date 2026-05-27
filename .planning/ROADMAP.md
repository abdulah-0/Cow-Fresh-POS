# Roadmap (Milestones 2 & 3)

## Milestone 2: Dairy Specialized POS & Delivery System (v2.0) — ✅ COMPLETED

### Phase 1: Database Schema Expansion & Typings — ✅ COMPLETED
* **Goal**: Expand database tables and Next.js models to support zones, customer coordinates, rider allocations, dispatches, deliveries, invoices, and milk inventories.

### Phase 2: Delivery Zone & Rider Management — ✅ COMPLETED
* **Goal**: Enable creating delivery zones, mapping customers to zones, and assigning dedicated riders to those zones.

### Phase 3: OpenStreetMap & Routing Engine Integration — ✅ COMPLETED
* **Goal**: Map delivery coordinates interactively using Leaflet and compute optimal sequences using OpenRouteService.

### Phase 4: Rider Dispatch, Return & Daily Milk Inventory Tracking — ✅ COMPLETED
* **Goal**: Implement stock allocations and returns for riders, alongside daily morning milk intake and remaining milk dashboards.

### Phase 5: Free WhatsApp Automation (Baileys) — ✅ COMPLETED
* **Goal**: Set up local WhatsApp Web socket authentication and trigger instant delivery confirmations for customers & admin.

### Phase 6: Monthly Invoicing & Billing Engine — ✅ COMPLETED
* **Goal**: Generate aggregated monthly invoices for delivery customers, with PDF export and direct WhatsApp distribution.

### Phase 7: Modular Cleanup & Access Security — ✅ COMPLETED
* **Goal**: Completely delete wastage/location modules and enforce security guards for riders vs. admins.

---

## Milestone 3: Additional Module & UI Enhancements (v3.0) — ✅ COMPLETED

### Phase 1: Database Migration & Types — ✅ COMPLETED
* **Goal**: Create schema migrations in `milestone3.sql` and declare TypeScript interfaces for customers, dispatch, and packing.

### Phase 2: Customer Zone Integration & Form Redesign — ✅ COMPLETED
* **Goal**: Remove Email, State, ZIP from Customer form, embed searchable Zone selector dropdown, and display Zone badges in customer listings.

### Phase 3: Packet-Level Dispatch Tracking — ✅ COMPLETED
* **Goal**: Incorporate picked/dropped milk & yogurt packet inputs in dispatches, auto-calculate net delivered packets, and render packet metrics columns.

### Phase 4: New Packing Module & Stock Sync — ✅ COMPLETED
* **Goal**: Build `packingService.ts` and packing page layout with a searchable items overlay, daily conversion weights parser, and automated Main Store inventory stock updates and reconciliation.

### Phase 5: Total Milk Remaining System & Dashboard Cards — ✅ COMPLETED
* **Goal**: Calculate real-time raw milk usage and render 5 cards (Received, Used in Packing, POS Sold, Rider Dispatched, Remaining Raw Milk) on dashboards.

### Phase 6: Responsive Drawer & Mobile-Friendly UI Enhancements — ✅ COMPLETED
* **Goal**: Build client `DashboardShell` with collapsible drawer sidebar, hamburger menu, overlay backdrop gestures, and path-change auto-closing.

### Phase 7: Cleanup & System Verification — ✅ COMPLETED
* **Goal**: Insert Packing into Sidebar navigation, delete locations/wastage paths, execute zero-error Next.js production build, and commit/push updates to Git.
