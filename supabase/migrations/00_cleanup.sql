-- ============================================================================
-- CLEAN SLATE: Drop all existing tables and types
-- ============================================================================
-- This ensures a fresh start for the multi-tenant schema

-- Drop all existing tables (CASCADE will drop dependent objects)
DROP TABLE IF EXISTS app_config CASCADE;
DROP TABLE IF EXISTS inventory_transactions CASCADE;
DROP TABLE IF EXISTS receivings_items CASCADE;
DROP TABLE IF EXISTS receivings CASCADE;
DROP TABLE IF EXISTS giftcards CASCADE;
DROP TABLE IF EXISTS sales_payments CASCADE;
DROP TABLE IF EXISTS sales_items CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS item_kit_items CASCADE;
DROP TABLE IF EXISTS item_kits CASCADE;
DROP TABLE IF EXISTS item_quantities CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS stock_locations CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS customers CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS people CASCADE;
DROP TABLE IF EXISTS tenant_users CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS tenants CASCADE;

-- Drop existing types
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan CASCADE;
DROP TYPE IF EXISTS tenant_role CASCADE;
DROP TYPE IF EXISTS sale_type CASCADE;
DROP TYPE IF EXISTS sale_status CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS get_current_tenant_id() CASCADE;
DROP FUNCTION IF EXISTS user_has_tenant_access(UUID) CASCADE;
