# Quick Start Guide - Cow Fresh POS

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

## Setup Steps

### 1. Supabase Setup (5 minutes)

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Copy/paste the entire contents of `supabase/master.sql`
4. Click **Run**
5. Go to **Settings** → **API** and copy:
   - Project URL
   - anon public key
   - service_role key (optional/needed for backend operations)

### 2. Environment Setup (1 minute)

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install & Run (2 minutes)

```bash
npm install
npm run dev
```

### 4. Test It Out

1. Open `http://localhost:3000`
2. You'll be redirected to the `/login` screen.
3. Login using the default superadmin credentials generated in the setup script:
   - **Email**: `snakeyes358@gmail.com`
   - **Password**: `Useless19112004`
4. You will land directly on the **Dashboard**!
5. Try the POS Register:
   - Click **"POS Register"** in the sidebar.
   - Click **"Add Sample"** to add test items, or create new items via the **Items** page.
   - Click/tap products, adjust quantities, select custom weights or customer loyalty tiers.
   - Click **"Complete Sale"** to process transactions.

## What You Get

✅ **Dedicated Single-Store POS** - Perfect for a local business (Cow Fresh Dairy)
✅ **Weight-Based POS Register** - Supports pieces, liters, kilograms, and grams
✅ **Inventory & Batch Freshness** - Built-in expiry and wastage tracking for dairy items
✅ **Role-Based Access Control** - Admin, Manager, and Cashier interfaces with ClientRoleGuard
✅ **Loyalty Program** - Points tracking and automatic tier discounts (Bronze to Diamond)
✅ **Real-Time Dashboard & Reports** - Beautiful, dynamic charts and stats

## Troubleshooting

**Can't connect to Supabase?**
- Check `.env.local` has correct values.
- Verify your Supabase project is active and not paused.
- Check the browser console for network request errors.

**Migration failed?**
- Make sure you are in the **SQL Editor** (not the Table Editor) in Supabase.
- Copy the ENTIRE `supabase/master.sql` script.
- If there are schema errors, make sure you are running on a clean, empty database.

## File Structure

```
cow-fresh-pos/
├── src/app/
│   ├── (dashboard)/     # Core single-store POS and dashboard views
│   ├── login/           # Authentication screen
│   └── signup/          # Redirects to login
├── src/components/
│   ├── features/        # Feature components (POS, items, employees, wastage, etc.)
│   └── ui/              # Shadcn primitive elements
├── supabase/
│   └── master.sql       # Single-tenant database schema & default data seeding
└── .env.local          # Your configuration (local environment)
```

Happy coding! 🚀
