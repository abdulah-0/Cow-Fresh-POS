# Modern POS System

A comprehensive Point of Sale system built with Next.js 14, TypeScript, Supabase, and shadcn/ui.

## Features

- 🛒 **POS Register** - Full-featured point of sale with barcode scanning
- 📦 **Inventory Management** - Track items, stock levels, and locations
- 👥 **Customer Management** - Customer database with purchase history
- 🚚 **Supplier Management** - Manage suppliers and receivings
- 👨‍💼 **Employee Management** - User roles and permissions
- 📊 **Reporting & Analytics** - Sales reports, inventory reports, and dashboards
- 🎁 **Gift Cards** - Gift card management and redemption
- ⚙️ **Settings** - Configurable tax rates, receipt templates, and more

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: Zustand
- **Forms**: React Hook Form + Zod
- **Tables**: TanStack Table
- **Charts**: Recharts
- **PDF**: React PDF

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account (free tier works)

### 1. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Project Settings > API to get your credentials
3. Go to SQL Editor and run the migration file:
   ```sql
   -- Copy and paste contents from supabase/migrations/20240101000000_initial_schema.sql
   ```
4. (Optional) Run the seed file for sample data:
   ```sql
   -- Copy and paste contents from supabase/seed.sql
   ```

### 2. Configure Environment Variables

1. Copy the environment template:
   ```bash
   cp ENV_TEMPLATE.txt .env.local
   ```

2. Update `.env.local` with your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Create Your First User

Since this is a fresh installation, you'll need to create your first admin user in Supabase:

1. Go to your Supabase project > Authentication > Users
2. Click "Add User" > "Create new user"
3. Enter email and password
4. After creating the user, go to SQL Editor and run:
   ```sql
   -- Insert person record
   INSERT INTO people (first_name, last_name, phone_number, email, address_1, city, state, zip, country)
   VALUES ('Admin', 'User', '555-555-5555', 'your_email@example.com', '123 Main St', 'City', 'State', '12345', 'USA');
   
   -- Create employee record (replace person_id with the id from above)
   INSERT INTO employees (person_id, username, deleted)
   VALUES (1, 'admin', FALSE);
   ```

Now you can log in with your email and password!

## Project Structure

```
pos-system/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (dashboard)/       # Protected dashboard routes
│   │   ├── login/             # Authentication
│   │   └── page.tsx           # Root redirect
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── layout/            # Layout components
│   │   └── features/          # Feature-specific components
│   ├── lib/
│   │   ├── supabase/          # Supabase clients
│   │   └── utils.ts           # Utility functions
│   ├── hooks/                 # Custom React hooks
│   ├── types/                 # TypeScript definitions
│   └── store/                 # Zustand stores
├── supabase/
│   ├── migrations/            # Database migrations
│   └── seed.sql              # Seed data
└── public/                    # Static assets
```

## Development Roadmap

### Phase 1: Foundation ✅
- [x] Next.js setup with TypeScript
- [x] Supabase integration
- [x] Authentication system
- [x] Layout and navigation
- [x] shadcn/ui components

### Phase 2: Core POS Features (In Progress)
- [ ] POS register interface
- [ ] Shopping cart
- [ ] Item search and barcode scanning
- [ ] Multi-payment processing
- [ ] Receipt generation

### Phase 3-7: Additional Features
- [ ] Inventory management
- [ ] Customer & supplier management
- [ ] Reporting & analytics
- [ ] Employee management
- [ ] Tax configuration
- [ ] Gift cards
- [ ] And more...

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Database Schema

The system uses a comprehensive PostgreSQL schema with:
- **People** - Base table for customers, suppliers, and employees
- **Items** - Inventory items with multi-location support
- **Sales** - Sales transactions with items and payments
- **Customers** - Customer information and discounts
- **Suppliers** - Supplier management
- **Employees** - User management
- **Gift Cards** - Gift card tracking
- **And more...**

See `supabase/migrations/20240101000000_initial_schema.sql` for the complete schema.

## Contributing

This is a custom POS system. Feel free to modify and extend it for your needs!

## License

MIT License - feel free to use this project for your business.
