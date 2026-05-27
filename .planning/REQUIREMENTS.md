# Requirements (Milestone 2 & Milestone 3)

## Functional Requirements

### 1. Zone-Based Customer Management
- [x] **ZONE-01**: Admin can create delivery zones with custom names (e.g., Bahria Town, DHA).
- [x] **ZONE-02**: Admin can assign customers to specific delivery zones.
- [x] **ZONE-03**: Admin can assign a dedicated rider to each zone.
- [x] **ZONE-04**: Admin can view all customers mapped inside each zone.

### 2. OSM Route Optimization System
- [x] **ROUTE-01**: System retrieves coordinates of all customers in a rider's assigned zone.
- [x] **ROUTE-02**: System queries OpenRouteService to calculate the shortest sequence-based delivery route.
- [x] **ROUTE-03**: System renders the optimized route polyline and customer markers interactively using Leaflet.js.
- [x] **ROUTE-04**: Rider can mark individual customer deliveries completed or pending directly on the route map.

### 3. Supply & Return Tracking (Rider Dispatch)
- [x] **DISP-01**: Admin can allocate stock quantities (milk, yogurt, butter, etc.) to riders before departures.
- [x] **DISP-02**: Admin can record returned unsold stock quantities from riders after deliveries.
- [x] **DISP-03**: System auto-calculates total delivered product quantities: `Delivered = Supplied - Returned`.

### 4. Daily Milk Inventory Tracking
- [x] **INVEN-01**: Admin can input daily morning milk intake received from suppliers.
- [x] **INVEN-02**: System automatically calculates end-of-day remaining milk inventory: `Remaining = Received - POS Sales - Rider Deliveries`.
- [x] **INVEN-03**: Dashboard displays cards for milk received, POS sold, rider deliveries, remaining inventory, and pending orders.

### 5. Free WhatsApp Automation (Baileys)
- [x] **WA-01**: Admin can scan a dynamic QR code once to link a local WhatsApp session via Baileys.
- [x] **WA-02**: System automatically sends WhatsApp text confirmations with products, quantities, and totals in PKR (Rs.) on delivery completion.
- [x] **WA-03**: System automatically alerts the administrator on successful delivery completion.

### 6. Monthly Invoice Generation
- [x] **BILL-01**: System aggregates all daily rider deliveries for each customer into a single monthly billing summary.
- [x] **BILL-02**: System generates printable and downloadable monthly PDF invoices.
- [x] **BILL-03**: Admin can send monthly invoice files directly to customers via WhatsApp.

### 7. Modular Cleanup & Security
- [x] **CLEAN-01**: Completely delete locations and wastage pages, database tables, and related code files.
- [x] **SEC-01**: Riders are restricted to the delivery module layout, and Admin/Cashier roles are enforced for POS/management dashboards.

### 8. Milestone 3: Customer Form & Zone dropdown (Customer Module)
- [x] **CUST-301**: Simplify Customer Form by removing Email, State, and ZIP Code fields.
- [x] **CUST-302**: Integrate dynamic searchable Zone dropdown selection inside Customer Dialog.
- [x] **CUST-303**: Automatically update customer zones and display Zone name badge in Customers data table listing.

### 9. Milestone 3: Packet-Level Dispatch Tracking (Dispatch Module)
- [x] **DISP-301**: Implement input tracking for Picked Milk Packets and Picked Yogurt Packets before deliveries.
- [x] **DISP-302**: Implement return tracking for Dropped Milk Packets and Dropped Yogurt Packets after deliveries.
- [x] **DISP-303**: Calculate and render live net delivered packets: `Net = Picked - Dropped` inside dispatch form summaries and table columns.

### 10. Milestone 3: Packing Module & Stock Sync (Packing Module)
- [x] **PACK-301**: Create dedicated Packing module page to input daily received milk supply.
- [x] **PACK-302**: Convert bulk raw milk into packaged dairy retail goods (Milk 1 KG, Milk 500 ML, Yogurt 1 KG) using math conversion weights.
- [x] **PACK-303**: Synchronize inventory stock levels dynamically at Main Store (location_id: 1) on creation, editing, and product deletion.

### 11. Milestone 3: Total Milk Remaining System
- [x] **REMAIN-301**: Implement system-wide lifecycle metrics formula: `Remaining = Total Received - Used In Packing - POS Sales - Rider Deliveries`.
- [x] **REMAIN-302**: Embed 5 cards detailing raw milk stages on Main Dashboard and Packing Dashboard.

### 12. Milestone 3: Mobile Responsive Layout Shell
- [x] **UI-301**: Build responsive DashboardShell navigation layout with a sliding sidebar drawer for screens under `1024px`.
- [x] **UI-302**: Integrate mobile header hamburger toggle trigger.
- [x] **UI-303**: Enforce tap-outside backdrop overlays and auto-collapse drawer when navigating page routes.

---

## Non-Functional Requirements
- [x] **PERF-01**: Map loading and optimal route sequence calculations render in under 3 seconds.
- [x] **SEC-02**: WhatsApp login credentials and socket sessions are persisted securely on local storage.
- [x] **COST-01**: No paid external routing, geocoding, or WhatsApp messaging API keys (100% open-source stack).
- [x] **BUILD-01**: Ensure dynamic and static page paths compile perfectly with 0 TypeScript/Next.js warnings or build errors.
