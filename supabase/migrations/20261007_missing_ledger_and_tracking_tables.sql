-- =====================================================
-- COW FRESH POS - MISSING LEDGER & TRACKING TABLES
-- Migration: 20261007_missing_ledger_and_tracking_tables.sql
-- =====================================================

-- 1. Customer Ledger Entries
CREATE TABLE IF NOT EXISTS customer_ledger_entries (
    id SERIAL PRIMARY KEY,
    customer_id INTEGER NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    transaction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('credit', 'payment', 'adjustment', 'advance')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    payment_method VARCHAR(50),
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_ledger_cust_time ON customer_ledger_entries (customer_id, transaction_time);

-- 2. Supplier Ledger Entries
CREATE TABLE IF NOT EXISTS supplier_ledger_entries (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
    transaction_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN ('credit', 'payment', 'adjustment', 'advance')),
    amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    description TEXT,
    payment_method VARCHAR(50),
    reference_id INTEGER,
    reference_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_supplier_ledger_supp_time ON supplier_ledger_entries (supplier_id, transaction_time);

-- 3. Packing Entries & Products (Milestone 3)
CREATE TABLE IF NOT EXISTS packing_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL DEFAULT CURRENT_DATE,
    total_milk_received DECIMAL(10,3) NOT NULL DEFAULT 0,
    total_milk_used DECIMAL(10,3) NOT NULL DEFAULT 0,
    remaining_milk DECIMAL(10,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS packing_products (
    packing_entry_id UUID REFERENCES packing_entries(id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES items(id) ON DELETE CASCADE,
    quantity_produced INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (packing_entry_id, product_id)
);

-- 4. Employee Commissions
CREATE TABLE IF NOT EXISTS commissions (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    sale_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
    commission_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    sale_total DECIMAL(10,2) NOT NULL DEFAULT 0,
    commission_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commissions_emp_status ON commissions (employee_id, status);

-- 5. Employee Time Tracking
CREATE TABLE IF NOT EXISTS time_entries (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    clock_in TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    clock_out TIMESTAMP WITH TIME ZONE,
    total_hours DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_time_entries_emp_in ON time_entries (employee_id, clock_in);

-- 6. Enable RLS
ALTER TABLE customer_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE packing_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to manage ledger and operational records
DROP POLICY IF EXISTS "Allow authenticated all customer_ledger" ON customer_ledger_entries;
CREATE POLICY "Allow authenticated all customer_ledger" ON customer_ledger_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all supplier_ledger" ON supplier_ledger_entries;
CREATE POLICY "Allow authenticated all supplier_ledger" ON supplier_ledger_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all packing_entries" ON packing_entries;
CREATE POLICY "Allow authenticated all packing_entries" ON packing_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all packing_products" ON packing_products;
CREATE POLICY "Allow authenticated all packing_products" ON packing_products FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all commissions" ON commissions;
CREATE POLICY "Allow authenticated all commissions" ON commissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated all time_entries" ON time_entries;
CREATE POLICY "Allow authenticated all time_entries" ON time_entries FOR ALL TO authenticated USING (true) WITH CHECK (true);
