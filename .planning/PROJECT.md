# Project: Cow Fresh POS

## Overview
A specialized Point of Sale (POS) system for Cow Fresh Dairy, focusing on milk product sales, weight-based pricing, fresh inventory management, zone-based rider delivery routing, and free WhatsApp automated confirmation notifications.

## Vision
To provide a premium, fast, and reliable retail and delivery management solution that simplifies billing and tracks the lifecycle of fresh dairy products from intake to final customer doorsteps.

## Core Modules
1. **POS Billing**: Fast checkout with weight-based support and dairy quick-filters.
2. **Delivery & Zone Management**: Dynamic delivery coverage zones mapped to dedicated riders.
3. **OpenStreetMap Routing**: Auto-routing and sequencing using Leaflet.js and OpenRouteService.
4. **WhatsApp Automation**: Direct session integration via Baileys to send text receipts and PDF monthly invoices for free.
5. **Inventory & Dispatch**: Tracking daily milk received against POS register sales and rider supply allocations.
6. **Monthly Invoicing**: Aggregated monthly billing engine with PDF download & WhatsApp send.

## Tech Stack
- **Frontend**: Next.js 16, Tailwind CSS 4, Radix UI, Zustand.
- **Backend/DB**: Supabase (PostgreSQL).
- **Mapping & Routing**: OpenStreetMap, Leaflet.js, OpenRouteService, Nominatim.
- **Messaging**: Baileys WhatsApp Library.
- **Format**: Dedicated Single-Store POS & Distribution Platform.

## Current Milestone: Milestone 2: Dairy Specialized POS & Delivery System (v2.0)

**Goal**: Extend the core retail POS with full zone-based delivery distribution, OSM route optimization, free automated WhatsApp alerts, and reconciled milk inventory calculations.

**Target features**:
* Zone-based customer management
* Route optimization using OpenStreetMap
* Rider delivery tracking
* Free WhatsApp automation
* Monthly invoice generation
* Rider supply tracking
* Rider return tracking
* Daily milk inventory tracking
* Remaining milk calculations
* Remove wastage module
* Remove locations module

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

*Last Updated: May 2026*
