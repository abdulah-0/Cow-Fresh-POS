# Supabase Database Setup Instructions

## Overview
This directory contains the SQL script to set up the complete database for the POS system.

## Setup Instructions

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to your Supabase project**
   - Visit [https://supabase.com](https://supabase.com)
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the setup script**
   - Copy the entire contents of `setup.sql`
   - Paste into the SQL Editor
   - Click "Run" or press `Ctrl+Enter`

4. **Verify setup**
   - Check the "Table Editor" to see all tables created
   - You should see 20+ tables

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push
```

## What Gets Created

### Tables (20+)
- `tenants` - Multi-tenant support
- `people` - Shared person data
- `employees` - Employee records
- `customers` - Customer records
- `suppliers` - Supplier records
- `items` - Inventory items
- `sales` - Sales transactions
- `inventory` - Stock levels
- `roles` - RBAC roles
- `customer_tiers` - Loyalty tiers
- `loyalty_points` - Customer points
- And more...

### Default Data
- **Tenant**: Demo Store (slug: `demo`)
- **Roles**: Admin, Manager, Cashier
- **Customer Tiers**: Bronze, Silver, Gold, Platinum, Diamond
- **Stock Location**: Main Store

### Your Superadmin Account
- **Email**: snakeyes358@gmail.com
- **Username**: superadmin
- **Password**: Useless19112004
- **Role**: Admin (full access)
- **Tenant**: demo

## After Setup

### 1. Update Environment Variables
Make sure your `.env.local` has:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Enable Email Auth (Optional)
If you want email/password authentication:
1. Go to Authentication → Providers
2. Enable Email provider
3. Configure email templates

### 3. Test Login
1. Go to your deployed app or run locally
2. Navigate to `/login`
3. Login with:
   - Email: `snakeyes358@gmail.com`
   - Password: `Useless19112004`
4. You should be redirected to `/demo/dashboard`

## Security Notes

⚠️ **IMPORTANT**: 
- The password in the script is encrypted using `crypt()` function
- Change your password after first login
- Never commit real passwords to version control
- Enable Row Level Security (RLS) policies for production

## Troubleshooting

### Error: "relation already exists"
- This means tables already exist
- Either drop existing tables or skip this error

### Error: "permission denied"
- Make sure you're running as database owner
- Check your Supabase project permissions

### Error: "function crypt does not exist"
- Run: `CREATE EXTENSION IF NOT EXISTS pgcrypto;`
- This enables password encryption

## Next Steps

1. ✅ Run the setup script
2. ✅ Verify all tables created
3. ✅ Test superadmin login
4. ✅ Create additional employees
5. ✅ Add your first items
6. ✅ Start selling!

## Support

For issues or questions:
- Check Supabase documentation: https://supabase.com/docs
- Review the POS system README
- Check the walkthrough.md in the artifacts directory
