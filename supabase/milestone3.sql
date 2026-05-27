-- Milestone 3 Database Schema Updates

-- 1. Add packet-level dispatch fields to rider_dispatch if not exists
ALTER TABLE rider_dispatch ADD COLUMN IF NOT EXISTS picked_milk_packets INTEGER NOT NULL DEFAULT 0;
ALTER TABLE rider_dispatch ADD COLUMN IF NOT EXISTS dropped_milk_packets INTEGER NOT NULL DEFAULT 0;
ALTER TABLE rider_dispatch ADD COLUMN IF NOT EXISTS picked_yogurt_packets INTEGER NOT NULL DEFAULT 0;
ALTER TABLE rider_dispatch ADD COLUMN IF NOT EXISTS dropped_yogurt_packets INTEGER NOT NULL DEFAULT 0;

-- 2. Add customer zone fields if they don't already exist (they are in master.sql, but just in case they're not in DB)
ALTER TABLE customers ADD COLUMN IF NOT EXISTS zone_id INTEGER REFERENCES zones(id) ON DELETE SET NULL;
ALTER TABLE customers ADD COLUMN IF NOT EXISTS delivery_address TEXT;

-- 3. Create packing_entries table
CREATE TABLE IF NOT EXISTS packing_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    total_milk_received DECIMAL(10,3) NOT NULL DEFAULT 0,
    total_milk_used DECIMAL(10,3) NOT NULL DEFAULT 0,
    remaining_milk DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create packing_products table
CREATE TABLE IF NOT EXISTS packing_products (
    packing_entry_id UUID REFERENCES packing_entries(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    quantity_produced INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (packing_entry_id, product_id)
);

-- Enable RLS for new tables
ALTER TABLE packing_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_products ENABLE ROW LEVEL SECURITY;

-- Disable RLS for local dev or add policies (we'll add select/all policies for employees)
DROP POLICY IF EXISTS "Allow all actions for authenticated users on packing_entries" ON packing_entries;
CREATE POLICY "Allow all actions for authenticated users on packing_entries" ON packing_entries
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all actions for authenticated users on packing_products" ON packing_products;
CREATE POLICY "Allow all actions for authenticated users on packing_products" ON packing_products
    FOR ALL TO authenticated USING (true) WITH CHECK (true);
