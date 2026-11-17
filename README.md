# 🥛 Cow Fresh Dairy POS & Operations Management System

A production-grade, full-stack Point of Sale (POS), Dairy Operations, Fleet Dispatch, and Automated Customer Messaging platform purpose-built for dairy retail, farm sourcing, packing, home delivery routes, and wholesale billing.

Built with **Next.js 16 (App Router & Turbopack)**, **TypeScript**, **Supabase (PostgreSQL & Row Level Security)**, **Tailwind CSS**, and **Green-API Cloud WhatsApp Gateway**.

---

## 🌟 Key Modules & Features

### 1. 🛒 POS Cashier Terminal (`/sales`)
- **Fast Barcode & Keyboard-Driven Interface:** Search products by SKU, barcode, or name with custom keyboard shortcuts (`F1`–`F9`).
- **Cart & Pricing Engine:** Dynamic percentage or fixed discounts, custom line-item adjustments, cash/card/split payment options.
- **Customer Association & Digital Receipts:** Select registered customers during checkout with instant balance lookups.
- **Automated Digital WhatsApp Receipts:** Sends itemized receipts via WhatsApp directly to opted-in customers upon sale completion.
- **Thermal Receipt Printing:** Instant 80mm/58mm thermal receipt printing and PDF generation.

### 2. 🥛 Milk Inventory & Dairy Processing (`/milk-inventory` & `/packing`)
- **Raw Milk Intake Tracking:** Log daily fresh milk received from suppliers/dairy farms in Liters.
- **Internal Conversion & Packing:** Convert raw milk into value-added products (pasteurized milk pouches, yogurt tubs, desi ghee, paneer, cream, butter).
- **Automated Reconciliation Formula:** Real-time formula balancing:
  $$\text{Remaining Milk} = \text{Received} - \text{Used in Packing} - \text{POS Direct Sold} - \text{Rider Delivered}$$
- **Discrepancy & Spoilage Auditing:** Pinpoint exact variance and eliminate milk pilferage or unexplained loss.

### 3. 🛵 Delivery Routes & Rider Management (`/delivery-routes` & `/zones`)
- **Geographic Delivery Zones:** Group customers into delivery sectors (e.g. Phase 1–8, Safari Valley) and assign dedicated riders.
- **Auto Geocoding & OpenStreetMap Navigation:** Automatically resolves customer addresses into GPS coordinates with interactive Leaflet map routing.
- **Route Optimization:** Calculate optimized stop-by-stop routes via OpenRouteService (ORS) with Haversine fallback.
- **One-Click Delivery WhatsApp Alerts:** When a rider toggles a stop to **Delivered**, the customer instantly receives a branded WhatsApp confirmation containing:
  - Customer name & phone number
  - Delivery timestamp (Pakistan PKT timezone)
  - Assigned rider's name & phone number
  - Delivery address & order summary

### 4. 🚚 Morning Rider Dispatch & Returns (`/dispatch`)
- **Supply vs. Return Tracking:** Record exact units issued to riders for morning/evening shifts and return quantities brought back.
- **Net Delivered Accounting:** Automatically compute net volume delivered and reconcile with rider cash collection.

### 5. 👥 Customer Management & Credit Profiles (`/customers`)
- **Customer Database:** Complete customer contact profiles, tax numbers, and geo-tagged delivery addresses.
- **WhatsApp Opt-in Controls:** Explicit opt-in management (`whatsapp_opt_in`, `whatsapp_phone`) complying with messaging standards.
- **Purchase History & Balances:** Instant view of outstanding receivables, delivery schedules, and historical orders.

### 6. 📄 Monthly Billing & WhatsApp Invoicing (`/invoices`)
- **Monthly Delivery Invoicing:** Aggregate daily delivery transactions for each customer into automated monthly statements.
- **One-Click WhatsApp Payment Reminders:** Send itemized payment reminders and statements directly to customer WhatsApp chats without leaving the dashboard.
- **Status Workflow:** Track `unpaid`, `partial`, and `paid` invoices with audit history.

### 7. 📒 Financial Ledgers & Accounting (`/ledgers`)
- **Customer Ledger (`/ledgers/customer`):** Double-entry chronological statement of invoices, sales, and payments received.
- **Supplier Ledger (`/ledgers/supplier`):** Sourcing ledger tracking daily milk intake value, payments issued, and outstanding supplier liabilities.
- **Financial Summary (`/ledgers/summary`):** High-level view of Total Accounts Receivable (AR), Accounts Payable (AP), and net operational cash balance.

### 8. 📦 Inventory & Stock Control (`/items` & `/receiving`)
- **Multi-Category Catalog:** Categorized management of dairy products, grocery items, packing materials, and beverages.
- **Supplier Receivings:** Purchase orders and bulk stock receipts with automated moving average cost calculations.
- **Low Stock & Expiry Alerts:** Visual badges and notifications for low stock levels.

### 9. 💸 Expense Management (`/expenses`)
- Record utility bills, rider fuel allowances, packaging costs, vehicle maintenance, and rent with category tagging.

### 10. 🎁 Loyalty & Rewards (`/loyalty`)
- Customer points accumulation rules, tier benefits, and point redemption at the POS terminal.

### 11. 🔐 Security, Permissions & Roles (`/employees`)
- **Role-Based Access Control (RBAC):** Admin, Manager, Cashier, and Rider roles with granular route protections.
- **Supabase Authentication & Middleware Guard:** Cookie session verification and automatic token refreshes preventing unauthorized access to protected dashboard views and API endpoints.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [Next.js 16](https://nextjs.org/) (App Router, Turbopack, React 19) |
| **Language** | [TypeScript 5](https://www.typescriptlang.org/) (Strict typing, 0 compile errors) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 16, Row Level Security, Auth) |
| **Styling & UI Components** | [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) + Radix UI + Lucide Icons |
| **Mapping & Routing** | [Leaflet](https://leafletjs.com/) + OpenStreetMap + OpenRouteService (ORS) |
| **WhatsApp Messaging** | [Green-API Cloud](https://green-api.com/) (Cloud gateway — zero Docker, keeps phone app active) |
| **State & Data Fetching** | [Zustand](https://zustand-demo.pmnd.rs/) + Server Actions / Route Handlers |
| **Data Visualization** | [Recharts](https://recharts.org/) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ installed
- A **Supabase** account (Free or Pro tier)
- A **Green-API** account (Free developer instance available at [green-api.com](https://green-api.com))

---

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/abdulah-0/Cow-Fresh-POS.git
cd Cow-Fresh-POS
npm install
```

---

### 2. Configure Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Database & Auth
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App Settings
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="Cow Fresh POS"
NODE_ENV=development

# WhatsApp Integration (Green API Cloud)
WHATSAPP_ENABLED=true
GREEN_API_ID_INSTANCE=your_instance_id
GREEN_API_TOKEN_INSTANCE=your_api_token
GREEN_API_URL=https://api.green-api.com

# OpenRouteService (Optional: Road Route Optimization)
NEXT_PUBLIC_ORS_API_KEY=your_ors_api_key
```

---

### 3. Database Schema Setup

1. Log in to your [Supabase Dashboard](https://supabase.com).
2. Navigate to **SQL Editor**.
3. Run the complete database schema file:
   - Copy and execute [supabase/master.sql](supabase/master.sql)
4. (Optional) Run any incremental migrations from `supabase/migrations/` if updating an existing database.

---

### 4. Connect Your WhatsApp (2 Minutes)

1. Register at [green-api.com](https://green-api.com).
2. Create an instance (choose Developer plan for free testing).
3. Scan the QR code displayed on the screen with your phone:
   - **WhatsApp &rarr; Linked Devices &rarr; Link a Device**.
4. Copy your `idInstance` and `apiTokenInstance` into your `.env` file.
5. Your WhatsApp is now connected! Your mobile app stays 100% functional on your phone.

---

### 5. Run the Application

```bash
# Start local development server
npm run dev

# Or build for production
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📁 Project Architecture

```
Cow-Fresh-POS/
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── customers/        # Customer CRM & credit accounts
│   │   │   ├── dashboard/        # Operational KPIs & milk summary
│   │   │   ├── delivery-routes/  # GPS map & delivery confirmation
│   │   │   ├── dispatch/         # Rider morning/evening load balancing
│   │   │   ├── employees/        # User management & roles
│   │   │   ├── expenses/         # Store & vehicle expenses
│   │   │   ├── invoices/         # Monthly statements & payment alerts
│   │   │   ├── items/            # Products & inventory management
│   │   │   ├── ledgers/          # Customer, supplier & summary ledgers
│   │   │   ├── loyalty/          # Points & customer loyalty
│   │   │   ├── milk-inventory/   # Daily milk intake & auditing
│   │   │   ├── packing/          # Dairy product conversion logs
│   │   │   ├── receiving/        # Purchase orders & stock receiving
│   │   │   ├── reports/          # Sales & inventory financial analytics
│   │   │   ├── sales/            # POS Register Cashier terminal
│   │   │   ├── sales-history/    # Past transactions & thermal reprints
│   │   │   ├── settings/         # Store branding & configuration
│   │   │   ├── suppliers/        # Dairy farm supplier records
│   │   │   └── zones/            # Geographical sector management
│   │   ├── api/
│   │   │   ├── geocoding/        # Address-to-coordinate resolver
│   │   │   ├── routes/           # ORS route optimization endpoint
│   │   │   └── whatsapp/         # Cloud WhatsApp dispatcher
│   │   └── login/                # Split-screen responsive authentication
│   ├── components/
│   │   ├── features/             # Modular domain UI components
│   │   ├── layout/               # Header, Sidebar, and App navigation
│   │   └── ui/                   # Primitive design system (shadcn/ui)
│   ├── lib/
│   │   ├── services/             # Supabase domain service layer
│   │   ├── supabase/             # Client & server database connectors
│   │   └── whatsapp/             # Green-API client, templates & phone utils
│   ├── middleware.ts             # Auth session refresh & route protection
│   └── types/                    # Centralized TypeScript domain contracts
└── supabase/
    ├── master.sql                # Complete consolidated database schema
    └── migrations/               # Incremental schema evolution scripts
```

---

## 🛡️ License

This project is licensed under the [MIT License](LICENSE).
