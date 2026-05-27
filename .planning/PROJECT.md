# Project: Cow Fresh POS

## Overview
A specialized Point of Sale (POS) system for Cow Fresh Dairy, focusing on milk product sales, weight-based pricing, fresh inventory management, zone-based rider delivery routing, free WhatsApp automated confirmation notifications, retail packing production and inventory sync, and a premium mobile-responsive shell navigation layout.

## Vision
To provide a premium, fast, and reliable retail and delivery management solution that simplifies billing and tracks the lifecycle of fresh dairy products from intake to final customer doorsteps.

## Core Modules
1. **POS Billing**: Fast checkout with weight-based support and dairy quick-filters.
2. **Delivery & Zone Management**: Dynamic delivery coverage zones mapped to dedicated riders.
3. **OpenStreetMap Routing**: Auto-routing and sequencing using Leaflet.js and OpenRouteService.
4. **WhatsApp Automation**: Direct session integration via Baileys to send text receipts and PDF monthly invoices for free.
5. **Inventory & Dispatch**: Tracking daily milk received against POS register sales and rider supply allocations.
6. **Monthly Invoicing**: Aggregated monthly billing engine with PDF download & WhatsApp send.
7. **Packing & Retail Conversions**: Smart packing logs with live math reconciliation and auto-sync to items inventory at Main Store.
8. **Premium Layout Shell**: Fully responsive collapsible drawer sidebar, hamburger layout, and stacking mobile grids.

## Tech Stack
- **Frontend**: Next.js 16, Tailwind CSS 4, Radix UI, Zustand.
- **Backend/DB**: Supabase (PostgreSQL).
- **Mapping & Routing**: OpenStreetMap, Leaflet.js, OpenRouteService, Nominatim.
- **Messaging**: Baileys WhatsApp Library.
- **Format**: Dedicated Single-Store POS & Distribution Platform.

## Milestones Summary

### ✅ Milestone 2: Dairy Specialized POS & Delivery System (v2.0) — COMPLETED
* Dynamic delivery coverage zones mapped to dedicated riders.
* Routing sequence optimization via Leaflet.js & OpenRouteService.
* Headless local WhatsApp session via Baileys for text receipts and PDF distribution.
* Supply allocation & returns tracking for riders.
* Monthly invoices generation and billing engine.
* Modular cleanup (wastage/locations deletion).

### ✅ Milestone 3: Additional Module & UI Enhancements (v3.0) — COMPLETED
* Customer-Zone integration with simplified form (Email, State, ZIP removed).
* Packet-level rider dispatch tracking (milk & yogurt packets supply, returns, and net delivered).
* Brand-new **Packing** module to log raw milk supply intake, select retail dairy items to produce, calculate usage conversions, and auto-sync/reconcile item stock at Main Store.
* "Total Milk Remaining" system displaying 5 real-time metrics cards on Packing and Main Dashboards.
* State-of-the-art collapsible navigation drawer shell and hamburger toggle layout for responsive devices under `1024px`.
* Soft backdrop gesture closing and path-change auto-collapsing.

*Last Updated: May 2026*
