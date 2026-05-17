# Roadmap (Milestone 2)

## Phase 1: Database Schema Expansion & Typings
* **Goal**: Expand database tables and Next.js models to support zones, customer coordinates, rider allocations, dispatches, deliveries, invoices, and milk inventories.
* **Requirements**: Mapped to database columns supporting all modules.
* **Success Criteria**:
  1. Updated `supabase/master.sql` runs without errors in Supabase.
  2. Next.js Typescript build compiles successfully with new types defined in `src/types/index.ts`.

## Phase 2: Delivery Zone & Rider Management
* **Goal**: Enable creating delivery zones, mapping customers to zones, and assigning dedicated riders to those zones.
* **Requirements**: ZONE-01, ZONE-02, ZONE-03, ZONE-04
* **Success Criteria**:
  1. Admin can add a zone, assign a customer to it, and map a rider in the UI.
  2. Assigned zones, customers, and riders are correctly updated and retrieved from Supabase.

## Phase 3: OpenStreetMap & Routing Engine Integration
* **Goal**: Map delivery coordinates interactively using Leaflet and compute optimal sequences using OpenRouteService.
* **Requirements**: ROUTE-01, ROUTE-02, ROUTE-03, ROUTE-04
* **Success Criteria**:
  1. Rider delivery page loads an interactive Leaflet map centered on zone coordinates.
  2. Routes are calculated and drawn dynamically, with correct ordering of delivery sequence.

## Phase 4: Rider Dispatch, Return & Daily Milk Inventory Tracking
* **Goal**: Implement stock allocations and returns for riders, alongside daily morning milk intake and remaining milk dashboards.
* **Requirements**: DISP-01, DISP-02, DISP-03, INVEN-01, INVEN-02, INVEN-03
* **Success Criteria**:
  1. Admin can dispatch products to riders, record returned stock, and view calculated delivered inventory.
  2. Daily milk received is recorded, POS and delivery sales are subtracted, and remaining stock renders correctly.

## Phase 5: Free WhatsApp Automation (Baileys)
* **Goal**: Set up local WhatsApp Web socket authentication and trigger instant delivery confirmations for customers & admin.
* **Requirements**: WA-01, WA-02, WA-03
* **Success Criteria**:
  1. Admin scans QR code to establish a headless local WhatsApp socket session.
  2. Delivering an order immediately sends text messages in PKR formatting to the customer and admin alerts.

## Phase 6: Monthly Invoicing & Billing Engine
* **Goal**: Generate aggregated monthly invoices for delivery customers, with PDF export and direct WhatsApp distribution.
* **Requirements**: BILL-01, BILL-02, BILL-03
* **Success Criteria**:
  1. Aggregated bills sum daily rider deliveries correctly.
  2. PDFs print accurately, and send options successfully dispatch files through the Baileys service.

## Phase 7: Modular Cleanup & Access Security
* **Goal**: Completely delete wastage/location modules and enforce security guards for riders vs. admins.
* **Requirements**: CLEAN-01, SEC-01, SEC-02
* **Success Criteria**:
  1. Wastage and locations folders and related files are permanently deleted.
  2. Riders logging in are locked into the delivery view, while admins can access full management tabs.
