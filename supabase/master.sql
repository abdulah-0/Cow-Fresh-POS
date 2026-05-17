-- =====================================================
-- COW FRESH POS - MASTER DATABASE SETUP (SINGLE STORE)
-- =====================================================
-- This script creates the entire database schema specialized for Dairy Shops.
-- Specialized for a dedicated single-store POS (Cow Fresh Dairy).
-- Includes: People, Roles, Employees, Customers, Suppliers,
-- Items (with Expiry & Weight Units), Inventory, Sales, Zones, Riders,
-- Deliveries, Routing, Dispatches, Invoices, and Milk Inventory.
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 0. CLEAN UP OLD SCHEMAS (Ensures schema matches perfectly — safe to re-run)
-- =====================================================

-- Milestone 2 tables (drop first as they depend on base tables)
DROP TABLE IF EXISTS milk_inventory CASCADE;
DROP TABLE IF EXISTS rider_dispatch CASCADE;
DROP TABLE IF EXISTS invoices CASCADE;
DROP TABLE IF EXISTS deliveries CASCADE;
DROP TABLE IF EXISTS delivery_routes CASCADE;

-- Core tables
DROP TABLE IF EXISTS sales_payments CASCADE;
DROP TABLE IF EXISTS sales_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS wastage CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS stock_locations CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS receivings_items CASCADE;
DROP TABLE IF EXISTS receivings CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS loyalty_transactions CASCADE;
DROP TABLE IF EXISTS loyalty_points CASCADE;
DROP TABLE IF EXISTS customer_tiers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS zones CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS expenses CASCADE;
DROP TABLE IF EXISTS app_config CASCADE;

-- =====================================================
-- 1. CORE SYSTEM TABLES
-- =====================================================

-- People (Shared base for all persons)
CREATE TABLE IF NOT EXISTS people (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone_number VARCHAR(50),
    address_1 VARCHAR(255),
    address_2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    zip VARCHAR(20),
    country VARCHAR(100),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles & Permissions
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    permissions TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employees
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    username VARCHAR(100) UNIQUE,
    role_id INTEGER REFERENCES roles(id),
    commission_rate DECIMAL(5,2) DEFAULT 0,
    commission_type VARCHAR(20) DEFAULT 'percentage',
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 2. DELIVERY ZONES
-- =====================================================

-- Delivery Zones (Groups customers into geographic delivery areas)
CREATE TABLE IF NOT EXISTS zones (
    id SERIAL PRIMARY KEY,
    zone_name VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_rider_id INTEGER, -- FK to employees, set later after employees table exists
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CUSTOMERS & LOYALTY
-- =====================================================

-- Customers (includes delivery zone and geo-coordinate fields)
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    account_number VARCHAR(100),
    taxable BOOLEAN DEFAULT TRUE,
    tax_id VARCHAR(100),
    discount_percent DECIMAL(5,2) DEFAULT 0,
    zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
    delivery_address TEXT,
    latitude DECIMAL(10,7),
    longitude DECIMAL(10,7),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty Program Tiers
CREATE TABLE IF NOT EXISTS customer_tiers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    min_points INTEGER NOT NULL DEFAULT 0,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    color VARCHAR(7) DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Customer Loyalty Balances
CREATE TABLE IF NOT EXISTS loyalty_points (
    customer_id INTEGER PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty History
CREATE TABLE IF NOT EXISTS loyalty_transactions (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    transaction_type VARCHAR(20) NOT NULL,
    reference_id INTEGER,
    reference_type VARCHAR(50),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. PRODUCTS & INVENTORY
-- =====================================================

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    person_id INTEGER NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    account_number VARCHAR(100),
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Items (Specialized for Dairy)
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    item_number VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(100),
    description TEXT,
    cost_price DECIMAL(10,2) DEFAULT 0,
    unit_price DECIMAL(10,2) NOT NULL,
    unit_type VARCHAR(20) DEFAULT 'piece', -- 'liter', 'kg', 'gram', 'piece'
    expiry_date DATE, -- Specialized for dairy freshness
    batch_number VARCHAR(100),
    reorder_level INTEGER DEFAULT 0,
    allow_alt_description BOOLEAN DEFAULT FALSE,
    is_serialized BOOLEAN DEFAULT FALSE,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock Locations
CREATE TABLE IF NOT EXISTS stock_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) UNIQUE NOT NULL,
    deleted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Inventory Levels
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id INTEGER NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) DEFAULT 0, -- Decimal for weight-based stock
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(item_id, location_id)
);

-- Inventory Logs
CREATE TABLE IF NOT EXISTS inventory_transactions (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES stock_locations(id),
    quantity DECIMAL(10,3) NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'sale', 'receiving', 'wastage', 'adjustment'
    reference_id INTEGER,
    reference_type VARCHAR(50),
    employee_id INTEGER REFERENCES employees(id),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Wastage Tracking (New for Dairy POS)
CREATE TABLE IF NOT EXISTS wastage (
    id SERIAL PRIMARY KEY,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity DECIMAL(10,3) NOT NULL,
    reason VARCHAR(255), -- 'expired', 'damaged', 'spilled'
    wastage_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    employee_id INTEGER REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 4. SALES & BILLING
-- =====================================================

-- Sales Transactions
CREATE TABLE IF NOT EXISTS sales (
    id SERIAL PRIMARY KEY,
    sale_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_id INTEGER REFERENCES customers(id),
    employee_id INTEGER REFERENCES employees(id),
    comment TEXT,
    invoice_number VARCHAR(100) UNIQUE,
    sale_status VARCHAR(50) DEFAULT 'completed',
    sale_total DECIMAL(10,2) NOT NULL,
    tax DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    discount_type VARCHAR(20) DEFAULT 'percent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Line Items
CREATE TABLE IF NOT EXISTS sales_items (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    description TEXT,
    serialnumber VARCHAR(255),
    line INTEGER NOT NULL,
    quantity DECIMAL(10,3) NOT NULL, -- Decimal for weight-based sales
    item_cost_price DECIMAL(10,2) DEFAULT 0,
    item_unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sales Payments
CREATE TABLE IF NOT EXISTS sales_payments (
    id SERIAL PRIMARY KEY,
    sale_id INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_type VARCHAR(50) NOT NULL, -- 'cash', 'card', 'mobile_wallet'
    payment_amount DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 5. PURCHASING & RECEIVING
-- =====================================================

-- Receivings
CREATE TABLE IF NOT EXISTS receivings (
    id SERIAL PRIMARY KEY,
    receiving_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    supplier_id INTEGER REFERENCES suppliers(id),
    employee_id INTEGER REFERENCES employees(id),
    comment TEXT,
    payment_type VARCHAR(50),
    reference VARCHAR(100),
    total_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Receiving Line Items
CREATE TABLE IF NOT EXISTS receivings_items (
    id SERIAL PRIMARY KEY,
    receiving_id INTEGER NOT NULL REFERENCES receivings(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id),
    description TEXT,
    line INTEGER NOT NULL,
    quantity_purchased DECIMAL(10,3) NOT NULL,
    item_cost_price DECIMAL(10,2) NOT NULL,
    item_unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 6. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_items_expiry ON items(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_item ON inventory(item_id);

-- =====================================================
-- 7. DEFAULT DATA SEEDING
-- =====================================================

-- Default roles
INSERT INTO roles (name, description, permissions)
SELECT 'Admin', 'Full system access', ARRAY['sales.view','sales.create','sales.edit','sales.delete','sales.refund','inventory.view','inventory.create','inventory.edit','inventory.delete','inventory.adjust','customers.view','customers.create','customers.edit','customers.delete','employees.view','employees.create','employees.edit','employees.delete','reports.view','reports.export','settings.view','settings.edit','roles.manage']
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Admin');

INSERT INTO roles (name, description, permissions)
SELECT 'Manager', 'Management access', ARRAY['sales.view','sales.create','sales.edit','sales.refund','inventory.view','inventory.create','inventory.edit','inventory.adjust','customers.view','customers.create','customers.edit','employees.view','reports.view','reports.export']
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Manager');

INSERT INTO roles (name, description, permissions)
SELECT 'Cashier', 'Basic POS access', ARRAY['sales.view','sales.create','inventory.view','customers.view','customers.create','reports.view']
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Cashier');

INSERT INTO roles (name, description, permissions)
SELECT 'Rider', 'Delivery module access only', ARRAY['delivery.view','delivery.complete','dispatch.view']
WHERE NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Rider');

-- Add FK from zones to employees (now that employees table exists)
ALTER TABLE zones
    DROP CONSTRAINT IF EXISTS zones_assigned_rider_id_fkey,
    ADD CONSTRAINT zones_assigned_rider_id_fkey
        FOREIGN KEY (assigned_rider_id) REFERENCES employees(id) ON DELETE SET NULL;

-- Customer tiers
INSERT INTO customer_tiers (name, min_points, discount_percent, color)
SELECT 'Bronze', 0, 2, '#CD7F32' WHERE NOT EXISTS (SELECT 1 FROM customer_tiers WHERE name = 'Bronze');

INSERT INTO customer_tiers (name, min_points, discount_percent, color)
SELECT 'Silver', 500, 5, '#C0C0C0' WHERE NOT EXISTS (SELECT 1 FROM customer_tiers WHERE name = 'Silver');

INSERT INTO customer_tiers (name, min_points, discount_percent, color)
SELECT 'Gold', 1000, 10, '#FFD700' WHERE NOT EXISTS (SELECT 1 FROM customer_tiers WHERE name = 'Gold');

INSERT INTO customer_tiers (name, min_points, discount_percent, color)
SELECT 'Platinum', 2500, 15, '#E5E4E2' WHERE NOT EXISTS (SELECT 1 FROM customer_tiers WHERE name = 'Platinum');

INSERT INTO customer_tiers (name, min_points, discount_percent, color)
SELECT 'Diamond', 5000, 20, '#B9F2FF' WHERE NOT EXISTS (SELECT 1 FROM customer_tiers WHERE name = 'Diamond');

-- Default stock location
INSERT INTO stock_locations (location_name)
SELECT 'Main Store' WHERE NOT EXISTS (SELECT 1 FROM stock_locations WHERE location_name = 'Main Store');

-- =====================================================
-- 5.5 EXTRA OPERATIONS & UTILITIES
-- =====================================================

-- Application Configuration
CREATE TABLE IF NOT EXISTS app_config (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Expenses
CREATE TABLE IF NOT EXISTS expenses (
    id SERIAL PRIMARY KEY,
    expense_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    category VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    payment_method VARCHAR(50) DEFAULT 'cash',
    employee_id INTEGER REFERENCES employees(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed default app_config
INSERT INTO app_config (key, value)
VALUES 
    ('company_name', 'Cow Fresh Dairy'),
    ('company_address', 'Cow Fresh Dairy Plaza # 86 E-1 Commercial Phase 8 Bahria Town Rawalpindi'),
    ('company_phone', '0331 0377703'),
    ('company_email', 'cowfreshdairy@gmail.com')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- =====================================================
-- 8. MILESTONE 2: DELIVERY, ROUTING, DISPATCH & INVOICING
-- =====================================================

-- Delivery Routes (Optimized rider paths per zone per day)
CREATE TABLE IF NOT EXISTS delivery_routes (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    zone_id INTEGER NOT NULL REFERENCES zones(id) ON DELETE CASCADE,
    route_data JSONB, -- GeoJSON polyline + ordered stop sequence from OpenRouteService
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    estimated_distance_km DECIMAL(8,2),
    estimated_duration_min INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deliveries (Individual completed rider delivery records)
CREATE TABLE IF NOT EXISTS deliveries (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    rider_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL,
    delivery_route_id INTEGER REFERENCES delivery_routes(id) ON DELETE SET NULL,
    products JSONB NOT NULL, -- [{item_id, name, quantity, unit_price}]
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending', -- 'pending', 'delivered', 'failed'
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invoices (Monthly aggregated customer billing)
CREATE TABLE IF NOT EXISTS invoices (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL, -- First day of the billing month, e.g., 2026-05-01
    total_deliveries INTEGER DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'unpaid', -- 'unpaid', 'paid', 'partial'
    invoice_pdf_url TEXT, -- Supabase storage URL for PDF
    whatsapp_sent BOOLEAN DEFAULT FALSE,
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(customer_id, billing_month)
);

-- Rider Dispatch (Daily stock allocations before and after deliveries)
CREATE TABLE IF NOT EXISTS rider_dispatch (
    id SERIAL PRIMARY KEY,
    rider_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    dispatch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    supplied_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    returned_quantity DECIMAL(10,3) NOT NULL DEFAULT 0,
    delivered_quantity DECIMAL(10,3) GENERATED ALWAYS AS (supplied_quantity - returned_quantity) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milk Inventory (Daily milk tracking — received vs sold vs delivered)
CREATE TABLE IF NOT EXISTS milk_inventory (
    id SERIAL PRIMARY KEY,
    inventory_date DATE NOT NULL UNIQUE DEFAULT CURRENT_DATE,
    total_received DECIMAL(10,3) NOT NULL DEFAULT 0, -- Litres received from supplier
    total_pos_sold DECIMAL(10,3) NOT NULL DEFAULT 0, -- Litres sold via POS register
    total_rider_deliveries DECIMAL(10,3) NOT NULL DEFAULT 0, -- Litres dispatched via riders
    remaining_milk DECIMAL(10,3) GENERATED ALWAYS AS
        (total_received - total_pos_sold - total_rider_deliveries) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for Milestone 2 tables
CREATE INDEX IF NOT EXISTS idx_deliveries_customer ON deliveries(customer_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_rider ON deliveries(rider_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_date ON deliveries(delivered_at);
CREATE INDEX IF NOT EXISTS idx_invoices_customer ON invoices(customer_id);
CREATE INDEX IF NOT EXISTS idx_rider_dispatch_rider ON rider_dispatch(rider_id);
CREATE INDEX IF NOT EXISTS idx_milk_inventory_date ON milk_inventory(inventory_date);
CREATE INDEX IF NOT EXISTS idx_customers_zone ON customers(zone_id);

-- =====================================================
-- SUCCESS NOTIFICATION
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ COW FRESH POS DATABASE SETUP COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Specialized for Dairy workflows (Single Store)';
    RAISE NOTICE '✅ Weight-based pricing support enabled';
    RAISE NOTICE '✅ Expiry tracking enabled';
    RAISE NOTICE '✅ Roles and Loyalty Tiers created';
    RAISE NOTICE '✅ Delivery Zones & Rider management ready';
    RAISE NOTICE '✅ OpenStreetMap Routing schema ready';
    RAISE NOTICE '✅ Rider Dispatch & Return tracking ready';
    RAISE NOTICE '✅ Daily Milk Inventory tracking ready';
    RAISE NOTICE '✅ Monthly Invoicing schema ready';
    RAISE NOTICE '';
    RAISE NOTICE '🎉 Your Cow Fresh POS v2.0 is ready for operation!';
    RAISE NOTICE '========================================';
END $$;
