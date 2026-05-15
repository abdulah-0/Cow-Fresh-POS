-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE sale_type AS ENUM ('sale', 'return', 'invoice', 'quote', 'work_order');
CREATE TYPE sale_status AS ENUM ('completed', 'suspended', 'cancelled');

-- People table (base for customers, suppliers, employees)
CREATE TABLE people (
    id BIGSERIAL PRIMARY KEY,
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

-- Employees table
CREATE TABLE employees (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    username VARCHAR(255) UNIQUE NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    company_name VARCHAR(255),
    account_number VARCHAR(255) UNIQUE,
    taxable BOOLEAN NOT NULL DEFAULT TRUE,
    discount_percent NUMERIC(15,2) NOT NULL DEFAULT 0,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Suppliers table
CREATE TABLE suppliers (
    id BIGSERIAL PRIMARY KEY,
    person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
    company_name VARCHAR(255) NOT NULL,
    agency_name VARCHAR(255) DEFAULT '',
    account_number VARCHAR(255) UNIQUE,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Stock locations table
CREATE TABLE stock_locations (
    id BIGSERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE
);

-- Insert default stock location
INSERT INTO stock_locations (location_name, deleted) VALUES ('Main Stock', FALSE);

-- Items table
CREATE TABLE items (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL DEFAULT '',
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    item_number VARCHAR(255) UNIQUE,
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
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Item quantities (stock per location)
CREATE TABLE item_quantities (
    item_id BIGINT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
    location_id BIGINT NOT NULL REFERENCES stock_locations(id) ON DELETE CASCADE,
    quantity NUMERIC(15,3) NOT NULL DEFAULT 0,
    PRIMARY KEY (item_id, location_id)
);

-- Item kits table
CREATE TABLE item_kits (
    id BIGSERIAL PRIMARY KEY,
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

-- Sales table
CREATE TABLE sales (
    id BIGSERIAL PRIMARY KEY,
    sale_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    comment TEXT DEFAULT '',
    invoice_number VARCHAR(32) UNIQUE,
    sale_type sale_type NOT NULL DEFAULT 'sale',
    status sale_status NOT NULL DEFAULT 'completed',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Sales items table
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

-- Sales payments table
CREATE TABLE sales_payments (
    id BIGSERIAL PRIMARY KEY,
    sale_id BIGINT NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
    payment_type VARCHAR(40) NOT NULL,
    payment_amount NUMERIC(15,2) NOT NULL
);

-- Giftcards table
CREATE TABLE giftcards (
    id BIGSERIAL PRIMARY KEY,
    giftcard_number BIGINT UNIQUE NOT NULL,
    value NUMERIC(15,2) NOT NULL,
    person_id BIGINT REFERENCES people(id) ON DELETE SET NULL,
    deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receivings table
CREATE TABLE receivings (
    id BIGSERIAL PRIMARY KEY,
    receiving_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    supplier_id BIGINT REFERENCES suppliers(id) ON DELETE SET NULL,
    employee_id BIGINT NOT NULL REFERENCES employees(id),
    comment TEXT DEFAULT '',
    payment_type VARCHAR(20),
    reference VARCHAR(32),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Receivings items table
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

-- Inventory transactions table
CREATE TABLE inventory_transactions (
    id BIGSERIAL PRIMARY KEY,
    item_id BIGINT NOT NULL REFERENCES items(id),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    trans_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    comment TEXT NOT NULL,
    location_id BIGINT NOT NULL REFERENCES stock_locations(id),
    quantity_change NUMERIC(15,3) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- App config table
CREATE TABLE app_config (
    key VARCHAR(50) PRIMARY KEY,
    value VARCHAR(500) NOT NULL
);

-- Insert default config
INSERT INTO app_config (key, value) VALUES
    ('company_name', 'My POS System'),
    ('currency_symbol', '$'),
    ('tax_rate', '0'),
    ('timezone', 'UTC');

-- Create indexes for better performance
CREATE INDEX idx_employees_person_id ON employees(person_id);
CREATE INDEX idx_customers_person_id ON customers(person_id);
CREATE INDEX idx_suppliers_person_id ON suppliers(person_id);
CREATE INDEX idx_items_supplier_id ON items(supplier_id);
CREATE INDEX idx_items_category ON items(category);
CREATE INDEX idx_sales_customer_id ON sales(customer_id);
CREATE INDEX idx_sales_employee_id ON sales(employee_id);
CREATE INDEX idx_sales_sale_time ON sales(sale_time);
CREATE INDEX idx_sales_items_sale_id ON sales_items(sale_id);
CREATE INDEX idx_sales_items_item_id ON sales_items(item_id);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(item_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_people_updated_at BEFORE UPDATE ON people FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_giftcards_updated_at BEFORE UPDATE ON giftcards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_receivings_updated_at BEFORE UPDATE ON receivings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE item_quantities ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE giftcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivings ENABLE ROW LEVEL SECURITY;
ALTER TABLE receivings_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Allow authenticated users to read/write for now - refine later)
CREATE POLICY "Allow authenticated users full access to people" ON people FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to employees" ON employees FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to customers" ON customers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to suppliers" ON suppliers FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to items" ON items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to item_quantities" ON item_quantities FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to sales" ON sales FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to sales_items" ON sales_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to sales_payments" ON sales_payments FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to giftcards" ON giftcards FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to receivings" ON receivings FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to receivings_items" ON receivings_items FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "Allow authenticated users full access to inventory_transactions" ON inventory_transactions FOR ALL USING (auth.role() = 'authenticated');
