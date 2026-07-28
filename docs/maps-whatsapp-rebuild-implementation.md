# Cow Fresh POS — Maps & WhatsApp Rebuild: Implementation Plan

## Purpose

This document replaces the existing OpenStreetMap route optimization module and the
Baileys WhatsApp integration in the Cow Fresh POS codebase. Both are being torn out
and rebuilt from scratch. This plan is written for an AI code editor (Cursor/Windsurf)
to execute phase by phase, with explicit acceptance criteria and human-escalation
checkpoints before anything irreversible happens.

**Decisions locked in for this rebuild:**
- Maps/Routing: **Keep Leaflet + Nominatim + OpenRouteService**, rebuilt correctly
  (this stack was never broken — it was incompletely implemented).
- WhatsApp: **Replace Baileys client-side redirect with the official Meta WhatsApp
  Cloud API**, using approved message templates for delivery notifications.

---

## Part 0: Removal Phase (Do This First)

### 0.1 — Audit before deletion
Before deleting anything, grep the codebase and produce a list of every file, import,
env var, and DB column referencing:
- `leaflet`, `react-leaflet`, `nominatim`, `openrouteservice`, `ORS`, route polylines
- `baileys`, `wa.me`, `window.open` WhatsApp redirects, any `whatsapp` service files

**🛑 Escalation checkpoint:** Present the full file list to the human before deleting
anything. Do not proceed to 0.2 without explicit confirmation.

### 0.2 — Delete/gut targets
- Remove all Leaflet map components, route polyline rendering, and ORS/Haversine
  fallback logic from the delivery route view.
- Remove `wa.me` link generation and any "Send WhatsApp" buttons tied to it.
- Remove unused `wastageService.ts` and any other dead files flagged in the audit
  (these were already noted as inactive in the original memory doc).
- Keep the **data models** (customers, zones, orders, riders) intact — only the
  presentation/integration layer is being removed.

**Acceptance criteria:** App builds and runs with maps/WhatsApp UI elements removed
or stubbed with "Coming soon" placeholders. No broken imports. No console errors.

---

## Part A: Maps & Route Optimization Rebuild

### Architecture
- **Geocoding:** Nominatim, but moved server-side (Next.js API route), never called
  directly from the browser. This respects Nominatim's usage policy (1 req/sec,
  requires a valid User-Agent) and avoids CORS/rate-limit failures in production.
- **Geocode caching:** Store resolved lat/lng on the customer/address record itself
  (add `latitude`, `longitude`, `geocoded_at` columns if not present) so you never
  re-geocode an unchanged address. This is the single biggest reliability fix.
- **Routing:** OpenRouteService Directions API, called server-side only (API key
  never exposed to the client — this was likely a `NEXT_PUBLIC_` var before, which
  leaks it in the browser bundle. Fix: rename to `ORS_API_KEY` with no
  `NEXT_PUBLIC_` prefix, call it from an API route).
- **Fallback:** Haversine straight-line estimation stays as the fallback, but it
  must be visually distinguished on the map (dashed line + a small "estimated route"
  badge) so riders don't mistake it for a real road path.

### Phase 1 — Server-side geocoding service
- Build `POST /api/geocoding/resolve` that accepts an address string, checks the
  cache column first, calls Nominatim only on cache miss, rate-limits to 1 req/sec
  server-side (queue or delay), and writes the result back to the customer record.
- **Acceptance criteria:** Creating/editing a customer address triggers geocoding
  exactly once; re-saving an unchanged address makes zero Nominatim calls; a
  deliberately malformed address fails gracefully with a user-facing error, not a
  crash.

### Phase 2 — Server-side routing service
- Build `POST /api/routes/optimize` that accepts a rider's stop list (already-
  geocoded coordinates), calls ORS Directions API server-side with the real key,
  and returns an ordered stop sequence + polyline.
- If `ORS_API_KEY` is missing/placeholder, the endpoint returns a
  `fallback: true` flag with Haversine-ordered stops instead of failing the request.
- **Acceptance criteria:** With a valid key, response includes real road-following
  polyline coordinates. With key removed, response still returns 200 with
  `fallback: true` and a straight-line sequence. No unhandled exceptions either way.

### Phase 3 — Map UI rebuild
- Rebuild the Leaflet map component to consume the two API routes above (no direct
  Nominatim/ORS calls from client code at all).
- Render fallback routes as dashed lines with an "Estimated (no live routing)"
  label; render real ORS routes as solid lines.
- Keep the existing "mark delivery Completed/Pending" interaction, now wired to the
  rebuilt data flow.
- **Acceptance criteria:** Rider can view their route, see correct visual treatment
  for real vs. estimated routes, and mark stops complete without page errors.

### Phase 4 — Ops safeguards
- Add a small admin-visible indicator on the dashboard: "Routing: Live (ORS)" or
  "Routing: Estimated (check API key)" so it's never a silent failure again.
- Log ORS API failures (rate limit, invalid key, quota exceeded) server-side so you
  can diagnose issues without the client reporting them.
- **Acceptance criteria:** Killing the ORS key in `.env` and restarting the app
  immediately shows the "Estimated" badge on the dashboard — no code changes needed
  to detect this.

---

## Part B: WhatsApp Integration Rebuild (Meta Cloud API)

### Architecture
- Use Meta's official **WhatsApp Business Cloud API** directly (no third-party
  wrapper needed at this scale — avoids extra vendor cost).
- Requires: a Meta Business Account, a WhatsApp Business Platform app, a verified
  business phone number, and **pre-approved message templates** for any message the
  business initiates outside a 24-hour customer-service window (which delivery
  confirmations are).
- No QR code, no persistent session, no ban risk — this is a stateless REST API
  call from your server using a permanent access token.

### Phase 1 — Meta setup (human task, not code)
**🛑 Escalation checkpoint:** This phase requires the client (Cow Fresh) to:
1. Create/verify a Meta Business Account and Business Manager.
2. Register a WhatsApp Business phone number (can be a new number — cannot reuse a
   number currently active on personal/regular WhatsApp Business app without
   migration).
3. Submit message templates for approval — at minimum: "Order Confirmed",
   "Out for Delivery", "Delivered". Approval typically takes minutes to ~24 hours.
4. Generate a permanent System User access token (not the 24-hour test token).

Do not proceed to Phase 2 until the client has completed steps 1–4 and shared the
Phone Number ID, WABA ID, and access token.

### Phase 2 — Server-side WhatsApp service
- Build `sendWhatsAppTemplate(phone, templateName, params)` as a server-only
  function calling `POST https://graph.facebook.com/v20.0/{phone-number-id}/messages`
  with the template name, language code, and dynamic parameters (customer name,
  order ID, ETA, etc.).
- Store `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID` as server-only env vars
  (never `NEXT_PUBLIC_`).
- **Acceptance criteria:** Calling the function with a test phone number and the
  approved "Order Confirmed" template delivers a real WhatsApp message to that
  number within seconds. Function throws a typed, catchable error (not a crash) on
  invalid template name, unapproved template, or expired token.

### Phase 3 — Wire into order/delivery lifecycle
- Trigger `sendWhatsAppTemplate` at the same points the old `wa.me` links were
  manually clicked: order created, rider marks dispatched, rider marks delivered.
- Make each trigger point idempotent (don't resend the same notification twice if
  a status is re-saved).
- **Acceptance criteria:** Moving an order through its full lifecycle in a staging
  environment produces exactly one WhatsApp message per stage, to the correct
  customer number, with correct dynamic values filled in.

### Phase 4 — Failure handling & visibility
- If a send fails (invalid number, template rejected, rate limit), log it against
  the order/customer record and surface a small "Notification failed" indicator in
  the admin UI — do not fail the underlying order/delivery action itself.
- Add a manual "Resend notification" button for admins as a fallback.
- **Acceptance criteria:** Simulating a failed send (e.g., malformed phone number)
  does not block the delivery status update; failure is visible and resendable.

### Phase 5 — Cutover
- Remove all remaining `wa.me` link code paths.
- **🛑 Escalation checkpoint:** Before going live, confirm with the client that the
  new business number is the one they want customers to receive messages from, and
  that they understand the per-message cost structure beyond the free tier (Meta's
  pricing is per conversation category — utility/marketing/service — and the
  current free allowance; confirm current rates directly in Meta's Business
  Platform pricing dashboard since these change periodically).

---

## Environment Variables (Final State)

```env
# Existing (unchanged)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Maps — server-side only, no NEXT_PUBLIC_ prefix
ORS_API_KEY=
NOMINATIM_USER_AGENT=CowFreshPOS/1.0 (contact@cowfresh.example)

# WhatsApp — server-side only
WHATSAPP_ACCESS_TOKEN=
WHATSAPP_PHONE_NUMBER_ID=
WHATSAPP_BUSINESS_ACCOUNT_ID=
```

Note the key change from the original setup: **ORS_API_KEY loses its
`NEXT_PUBLIC_` prefix.** In the old implementation this exposed the key in the
client-side JS bundle, meaning anyone could extract it from browser devtools and
use it against the client's quota. This must move to server-only.

---

## Rollout Order

1. Part 0 (removal + audit) — with human sign-off before deletion.
2. Part A in full (maps) — lower risk, no external account dependencies.
3. Part B Phase 1 (Meta setup) — can run in parallel with Part A since it's a
   client-side administrative task, not code.
4. Part B Phases 2–5 once Meta setup is confirmed complete.
5. Staging test of both systems together before production cutover.

## Out of Scope (flag if it comes up later)
- Two-way WhatsApp conversations (customer replies) — Cloud API supports this but
  it's a separate webhook-handling feature, not part of this rebuild.
- Automated PDF invoice delivery over WhatsApp — mentioned in the original SRD but
  not part of this scope; would be a Phase 6 addition using WhatsApp's document
  message type once the core template flow is stable.
