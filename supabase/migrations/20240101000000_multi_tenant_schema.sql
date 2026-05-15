-- Multi-Tenant SaaS POS System Database Schema
-- This schema supports multiple tenants (businesses) with complete data isolation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing types if they exist (to avoid conflicts)
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS tenant_role CASCADE;
DROP TYPE IF EXISTS sale_type CASCADE;
DROP TYPE IF EXISTS sale_status CASCADE;

-- Create enum types
CREATE TYPE subscription_status AS ENUM ('trial', 'active', 'past_due', 'cancelled');
CREATE TYPE subscription_plan AS ENUM ('starter', 'professional', 'enterprise');
CREATE TYPE tenant_role AS ENUM ('owner', 'admin', 'manager', 'cashier');
CREATE TYPE sale_type AS ENUM ('sale', 'return', 'invoice', 'quote', 'work_order');
CREATE TYPE sale_status AS ENUM ('completed', 'suspended', 'cancelled');

-- ============================================================================
-- TENANT MANAGEMENT TABLES
-- ============================================================================

-- Tenants (Organizations/Businesses)
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    subscription_status subscription_status NOT NULL DEFAULT 'trial',
    subscription_plan subscription_plan NOT NULL DEFAULT 'starter',
    trial_ends_at TIMESTAMPTZ,
    subscription_ends_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Profiles (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    avatar_url TEXT,
    current_tenant_id UUID REFERENCES tenants(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tenant Users (Team Members)
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role tenant_role NOT NULL DEFAULT 'cashier',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invited_at TIMESTAMPTZ,
    joined_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- ============================================================================
-- CORE BUSINESS TABLES (All include tenant_id for data isolation)
-- ============================================================================

-- People (base for customers, suppliers, employees)
CREATE TABLE people (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    gender SMALLINT,
    phone_number VARCHAR(255) NOT NULL DEFAULT '',
    email VARCHAR(255) NOT NULL DEFAULT '',
    address_1 VARCHAR(255) NOT NULL DEFAULT '',
    address_2 VARCHAR(255) DEFAULT '',
    city VARCHAR(255) NOT NULL DEFAULT '',
    state VARCHAR(255) NOT NULL DEFAULT '',
    zip VARCHAR(255) NOT NULL DEFAULT '',
    country VARCHAR(255) NOT NULL DEFAULT '',
    comments TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Employees
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, username)
);

-- Customers
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    account_number VARCHAR(255),
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    discount_percent NUMERIC(15,2) NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, account_number)
);

-- Suppliers
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255) DEFAULT '',
    account_number VARCHAR(255),
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, account_number)
);

-- Stock locations
CREATE TABLE stock_locations (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    location_name VARCHAR(255) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Items
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL DEFAULT '',
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    item_number VARCHAR(255),
    description VARCHAR(255) NOT NULL DEFAULT '',
    cost_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    unit_price NUMERIC(15,2) NOT NULL DEFAULT 0,
    reorder_level NUMERIC(15,3) NOT NULL DEFAULT 0,
    receiving_quantity NUMERIC(15,3) NOT NULL DEFAULT 1,
    pic_id BIGINT,
    allow_alt_description BOOLEAN NOT NULL DEFAULT FALSE,
    is_serialized BOOLEAN NOT NULL DEFAULT FALSE,
    custom1 VARCHAR(25) DEFAULT '',
    custom2 VARCHAR(25) DEFAULT '',
    custom3 VARCHAR(25) DEFAULT '',
    custom4 VARCHAR(25) DEFAULT '',
    custom5 VARCHAR(25) DEFAULT '',
    custom6 VARCHAR(25) DEFAULT '',
    custom7 VARCHAR(25) DEFAULT '',
    custom8 VARCHAR(25) DEFAULT '',
    custom9 VARCHAR(25) DEFAULT '',
    custom10 VARCHAR(25) DEFAULT '',
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, item_number)
);

-- Item quantities (stock per location)
CREATE TABLE item_quantities (
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id BIGINT NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    PRIMARY KEY (item_id, location_id)
);

-- Item kits
CREATE TABLE item_kits (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT ''
);

-- Item kit items (junction table)
CREATE TABLE item_kit_items (
    item_kit_id BIGINT NOT NULL REFERENCES item_kits(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    quantity NUMERIC(15,3) NOT NULL DEFAULT 1,
    PRIMARY KEY (item_kit_id, item_id, quantity)
);

-- Sales
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    sale_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    comment TEXT DEFAULT '',
    invoice_number VARCHAR(32),
    sale_type sale_type NOT NULL DEFAULT 'sale',
    status sale_status NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, invoice_number)
);

-- Sales items
CREATE TABLE sales_items (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    description VARCHAR(30),
    serialnumber VARCHAR(30),
    line INTEGER NOT NULL,
    quantity_purchased NUMERIC(15,3) NOT NULL DEFAULT 0,
    item_cost_price NUMERIC(15,2) NOT NULL,
    item_unit_price NUMERIC(15,2) NOT NULL,
    discount_percent NUMERIC(15,2) NOT NULL DEFAULT 0,
    item_location BIGINT NOT NULL REFERENCES stock_locations(id)
);

-- Sales payments
CREATE TABLE sales_payments (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_type VARCHAR(40) NOT NULL,
    payment_amount NUMERIC(15,2) NOT NULL
);

-- Giftcards
CREATE TABLE giftcards (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    giftcard_number BIGINT NOT NULL,
    value NUMERIC(15,2) NOT NULL,
    person_id BIGINT REFERENCES people(id) ON DELETE SET NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(tenant_id, giftcard_number)
);

-- Receivings
CREATE TABLE receivings (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    receiving_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    comment TEXT DEFAULT '',
    payment_type VARCHAR(20),
    reference VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receivings items
CREATE TABLE receivings_items (
    receiving_id BIGINT NOT NULL REFERENCES receivings(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    description VARCHAR(30),
    serialnumber VARCHAR(30),
    line INTEGER NOT NULL,
    quantity_purchased NUMERIC(15,3) NOT NULL DEFAULT 0,
    item_cost_price NUMERIC(15,2) NOT NULL,
    item_unit_price NUMERIC(15,2) NOT NULL,
    discount_percent NUMERIC(15,2) NOT NULL DEFAULT 0,
    item_location BIGINT NOT NULL REFERENCES stock_locations(id),
    receiving_quantity NUMERIC(15,3) NOT NULL DEFAULT 1,
    PRIMARY KEY (receiving_id, item_id, line)
);

-- Inventory transactions
CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    item_id BIGINT NOT NULL REFERENCES items(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    trans_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment TEXT NOT NULL,
    location_id BIGINT NOT NULL REFERENCES stock_locations(id),
    quantity_change NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App config (tenant-specific settings)
CREATE TABLE app_config (
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(50) NOT NULL,
    value VARCHAR(500) NOT NULL,
    PRIMARY KEY (tenant_id, key)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_tenant_users_tenant_id ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user_id ON tenant_users(user_id);
CREATE INDEX idx_profiles_current_tenant_id ON profiles(current_tenant_id);

CREATE INDEX idx_people_tenant_id ON people(tenant_id);
CREATE INDEX idx_employees_tenant_id ON employees(tenant_id);
CREATE INDEX idx_employees_person_id ON employees(person_id);
CREATE INDEX idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX idx_customers_person_id ON customers(person_id);
CREATE INDEX idx_suppliers_tenant_id ON suppliers(tenant_id);
CREATE INDEX idx_suppliers_person_id ON suppliers(person_id);

CREATE INDEX idx_items_tenant_id ON items(tenant_id);
CREATE INDEX idx_items_supplier_id ON items(supplier_id);
CREATE INDEX idx_items_category ON items(category);

CREATE INDEX idx_sales_tenant_id ON sales(tenant_id);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_employee_id ON sales(employee_id);
CREATE INDEX idx_sales_sale_time ON sales(sale_time);
CREATE INDEX idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX idx_sales_items_item_id ON sales_items(item_id);

CREATE INDEX idx_inventory_transactions_tenant_id ON inventory_transactions(tenant_id);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(item_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON tenants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tenant_users_updated_at BEFORE UPDATE ON tenant_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_giftcards_updated_at BEFORE UPDATE ON giftcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receivings_updated_at BEFORE UPDATE ON receivings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get current user's tenant_id
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
    SELECT current_tenant_id 
    FROM profiles 
    WHERE id = auth.uid()
$$ LANGUAGE SQL STABLE;

-- Check if user has access to tenant
CREATE OR REPLACE FUNCTION user_has_tenant_access(check_tenant_id UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 
        FROM tenant_users 
        WHERE user_id = auth.uid() 
        AND tenant_id = check_tenant_id
    )
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_kit_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE giftcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivings ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivings_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Tenants
CREATE POLICY "Users can view their own tenants"
ON tenants FOR SELECT
USING (id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can update their own tenants if they are owner or admin"
ON tenants FOR UPDATE
USING (id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
));

-- RLS Policies for Profiles
CREATE POLICY "Users can view all profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- RLS Policies for Tenant Users
CREATE POLICY "Users can view members of their tenants"
ON tenant_users FOR SELECT
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Owners and admins can manage team members"
ON tenant_users FOR ALL
USING (tenant_id IN (
    SELECT tenant_id FROM tenant_users 
    WHERE user_id = auth.uid() 
    AND role IN ('owner', 'admin')
));

-- RLS Policies for Business Tables (tenant-scoped)
CREATE POLICY "Users can only access their tenant's people"
ON people FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's employees"
ON employees FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's customers"
ON customers FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's suppliers"
ON suppliers FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's stock locations"
ON stock_locations FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's items"
ON items FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's item quantities"
ON item_quantities FOR ALL
USING (item_id IN (
    SELECT id FROM items 
    WHERE tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
));

CREATE POLICY "Users can only access their tenant's item kits"
ON item_kits FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's sales"
ON sales FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's sales items"
ON sales_items FOR ALL
USING (sale_id IN (
    SELECT id FROM sales 
    WHERE tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
));

CREATE POLICY "Users can only access their tenant's sales payments"
ON sales_payments FOR ALL
USING (sale_id IN (
    SELECT id FROM sales 
    WHERE tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
));

CREATE POLICY "Users can only access their tenant's giftcards"
ON giftcards FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's receivings"
ON receivings FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's receivings items"
ON receivings_items FOR ALL
USING (receiving_id IN (
    SELECT id FROM receivings 
    WHERE tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid())
));

CREATE POLICY "Users can only access their tenant's inventory transactions"
ON inventory_transactions FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Users can only access their tenant's config"
ON app_config FOR ALL
USING (tenant_id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));
