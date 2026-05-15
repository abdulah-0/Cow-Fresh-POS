# Concerns

## Technical Debt
- **Mock Data**: Several pages (like `sales/page.tsx`) still use mock data or have "TODO" comments for actual Supabase integration.
- **Missing Tests**: Lack of automated testing increases risk of regressions during refactoring.

## Feature Gaps (Dairy Shop Specific)
- **Weight-Based Calculation**: POS needs specific support for decimal quantities (KG, Liters) and price calculation based on weight.
- **Expiry Tracking**: Items need an `expiry_date` field and the UI needs alerts for nearing expiry.
- **Wastage Management**: No dedicated module for recording damaged/wasted products.
- **Loyalty System**: Basic structure exists but detailed customer points logic and tier-based discounts need full implementation.

## Security
- **RLS**: Ensure Supabase Row Level Security is strictly applied for multi-tenancy.
