# Requirements (Milestone 2)

## Functional Requirements

### 1. Zone-Based Customer Management
- [ ] **ZONE-01**: Admin can create delivery zones with custom names (e.g., Bahria Town, DHA).
- [ ] **ZONE-02**: Admin can assign customers to specific delivery zones.
- [ ] **ZONE-03**: Admin can assign a dedicated rider to each zone.
- [ ] **ZONE-04**: Admin can view all customers mapped inside each zone.

### 2. OSM Route Optimization System
- [ ] **ROUTE-01**: System retrieves coordinates of all customers in a rider's assigned zone.
- [ ] **ROUTE-02**: System queries OpenRouteService to calculate the shortest sequence-based delivery route.
- [ ] **ROUTE-03**: System renders the optimized route polyline and customer markers interactively using Leaflet.js.
- [ ] **ROUTE-04**: Rider can mark individual customer deliveries completed or pending directly on the route map.

### 3. Supply & Return Tracking (Rider Dispatch)
- [ ] **DISP-01**: Admin can allocate stock quantities (milk, yogurt, butter, etc.) to riders before departures.
- [ ] **DISP-02**: Admin can record returned unsold stock quantities from riders after deliveries.
- [ ] **DISP-03**: System auto-calculates total delivered product quantities: `Delivered = Supplied - Returned`.

### 4. Daily Milk Inventory Tracking
- [ ] **INVEN-01**: Admin can input daily morning milk intake received from suppliers.
- [ ] **INVEN-02**: System automatically calculates end-of-day remaining milk inventory: `Remaining = Received - POS Sales - Rider Deliveries`.
- [ ] **INVEN-03**: Dashboard displays cards for milk received, POS sold, rider deliveries, remaining inventory, and pending orders.

### 5. Free WhatsApp Automation (Baileys)
- [ ] **WA-01**: Admin can scan a dynamic QR code once to link a local WhatsApp session via Baileys.
- [ ] **WA-02**: System automatically sends WhatsApp text confirmations with products, quantities, and totals in PKR (Rs.) on delivery completion.
- [ ] **WA-03**: System automatically alerts the administrator on successful delivery completion.

### 6. Monthly Invoice Generation
- [ ] **BILL-01**: System aggregates all daily rider deliveries for each customer into a single monthly billing summary.
- [ ] **BILL-02**: System generates printable and downloadable monthly PDF invoices.
- [ ] **BILL-03**: Admin can send monthly invoice files directly to customers via WhatsApp.

### 7. Modular Cleanup & Security
- [ ] **CLEAN-01**: Completely delete locations and wastage pages, database tables, and related code files.
- [ ] **SEC-01**: Riders are restricted to the delivery module layout, and Admin/Cashier roles are enforced for POS/management dashboards.

---

## Non-Functional Requirements
- [ ] **PERF-01**: Map loading and optimal route sequence calculations render in under 3 seconds.
- [ ] **SEC-02**: WhatsApp login credentials and socket sessions are persisted securely on local server storage.
- [ ] **COST-01**: No paid external routing, geocoding, or WhatsApp messaging API keys (100% open-source stack).
