# Integrations

## External Services
- **Supabase**: Used for Database, Authentication, and Session management.
  - SSR support via `@supabase/ssr`.
  - Database schema follows an OSPOS-inspired multi-tenant structure.

## Hardware & Formats
- **Barcode Scanners**: Supported via text input/keydown events in POS Billing.
- **Printers**: Support for generating receipts (intended via @react-pdf/renderer or window.print).
- **Excel/CSV**: Export/Import capabilities via `xlsx`.

## APIs
- **Supabase JS SDK**: Primary interface for data operations.
