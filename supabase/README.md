# Supabase Database Setup Instructions

## Overview
This directory contains the SQL script to set up the complete database schema for the dedicated, single-store POS system optimized for dairy shops.

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project**
   - Visit [https://supabase.com](https://supabase.com)
   - Select your project.

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar.
   - Click "New Query".

3. **Run the setup script**
   - Copy the entire contents of `master.sql`.
   - Paste it into the SQL Editor.
   - Click "Run" or press `Ctrl+Enter`.

4. **Verify setup**
   - Check the "Table Editor" to see all tables created.
   - You should see 18 tables populated and configured.

### Option 2: Using Supabase CLI

```bash
# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration or seed the schema directly
# (You can also apply master.sql directly to your linked database)
```

## What Gets Created

### Tables (18)
- `people` - Base table for storing personal profiles.
- `employees` - Employee accounts linked to authorization and store roles.
- `roles` - RBAC access control configuration (Admin, Manager, Cashier).
- `customers` - Customer accounts for sales and loyalty tracking.
- `customer_tiers` - Loyalty program status tier rewards.
- `loyalty_points` - Current points balance for each customer.
- `loyalty_transactions` - Ledger of loyalty points accumulation and redemptions.
- `suppliers` - Product suppliers records.
- `items` - Product items (supports bulk/weight units, batch numbers, and expiry tracking).
- `stock_locations` - Warehouse and store locations.
- `inventory` - Inventory level quantities at each stock location.
- `inventory_transactions` - Detailed ledger of stock transactions (sales, receivings, wastage, adjustments).
- `wastage` - Spoiled, damaged, or expired stock logging (essential for fresh dairy products).
- `sales` - Completed sale transactions invoices.
- `sales_items` - Product line items purchased in each sale.
- `sales_payments` - Payment details for completed sales (Cash, Card, Wallet).
- `receivings` - Stock receivings from suppliers.
- `receivings_items` - Items received in each transaction.

### Default Seeding Data
- **Roles**: Admin (full system access), Manager (management access), Cashier (basic POS access)
- **Customer Tiers**: Bronze, Silver, Gold, Platinum, Diamond
- **Stock Location**: Main Store

### Default Administrator Account
- **Email**: `snakeyes358@gmail.com`
- **Password**: `Useless19112004` (Enforced securely via pgcrypto encryption)
- **Role**: Admin (full access)

## After Setup

### 1. Update Environment Variables
Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Enable Email Auth
If you want email/password authentication:
1. Go to **Authentication** → **Providers** in Supabase Dashboard.
2. Ensure the **Email** provider is enabled.
3. Configure signup confirmation preferences as needed.

### 3. Test Login
1. Start your local dev server: `npm run dev`.
2. Go to your local page `http://localhost:3000`.
3. Sign in with the administrator email `snakeyes358@gmail.com` and password `Useless19112004`.
4. You will be successfully logged in and routed to `/dashboard`.

## Troubleshooting

### Error: "relation already exists"
- This means tables already exist in your Supabase schema. If you want a clean state, drop the existing public schema tables first before running `master.sql`.

### Error: "function crypt does not exist"
- Run: `CREATE EXTENSION IF NOT EXISTS pgcrypto;` at the top of your SQL editor to enable cryptographic functions for password hashing.
