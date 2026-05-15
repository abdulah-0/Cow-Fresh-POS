# Quick Start Guide

## Prerequisites
- Node.js 18+ installed
- A Supabase account (free tier works)

## Setup Steps

### 1. Supabase Setup (5 minutes)

1. Create project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → **New Query**
3. Copy/paste contents of `supabase/migrations/20240101000000_multi_tenant_schema.sql`
4. Click **Run**
5. Go to **Settings** → **API** and copy:
   - Project URL
   - anon public key

### 2. Environment Setup (1 minute)

Create `.env.local` in project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 3. Install & Run (2 minutes)

```bash
cd pos-system
npm install
npm run dev
```

### 4. Test It Out

1. Open `http://localhost:3000`
2. Click **"Start Free Trial"**
3. Complete the 3-step signup
4. You'll land on your dashboard!
5. Try the POS Register:
   - Click **"POS Register"** in sidebar
   - Click **"Add Sample"** to add test items
   - Adjust quantities with +/- buttons
   - See totals update automatically

## What You Get

✅ **Multi-tenant SaaS** - Complete data isolation
✅ **Landing page** - Professional marketing site
✅ **Pricing page** - 3 subscription tiers
✅ **Signup flow** - Automatic tenant creation
✅ **POS Register** - Shopping cart with totals
✅ **Dashboard** - Stats and quick actions

## Next Steps

Continue development with:
- Item search from database
- Multi-payment processing
- Receipt generation
- Inventory management
- Customer management
- Reporting

## Troubleshooting

**Can't connect to Supabase?**
- Check `.env.local` has correct values
- Verify Supabase project is active
- Check browser console for errors

**Migration failed?**
- Make sure you're in SQL Editor (not Table Editor)
- Copy the ENTIRE migration file
- Check for any SQL errors in output

**Signup not working?**
- Check Supabase logs in Dashboard
- Verify RLS policies are enabled
- Check browser console for errors

## File Structure

```
pos-system/
├── src/app/
│   ├── (marketing)/     # Landing & pricing
│   ├── (dashboard)/     # Protected app
│   ├── signup/          # Registration
│   └── login/           # Authentication
├── supabase/
│   └── migrations/      # Database schema
└── .env.local          # Your config (create this!)
```

## Support

- Review `IMPLEMENTATION_SUMMARY.md` for detailed docs
- Check `implementation_plan.md` for architecture
- See `phase0_walkthrough.md` for SaaS features

Happy coding! 🚀
