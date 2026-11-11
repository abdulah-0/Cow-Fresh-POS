-- =====================================================
-- COW FRESH POS - WHATSAPP INTEGRATION (EVOLUTION GO)
-- Migration: 20261007_whatsapp_evolution.sql
-- =====================================================

-- 1. Alter customers table for WhatsApp opt-in and direct phone
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS whatsapp_phone TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS whatsapp_opt_in_at TIMESTAMPTZ;

-- Fallback for PostgreSQL versions that don't support ADD COLUMN IF NOT EXISTS NOT NULL DEFAULT
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'whatsapp_phone') THEN
    ALTER TABLE customers ADD COLUMN whatsapp_phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'whatsapp_opt_in') THEN
    ALTER TABLE customers ADD COLUMN whatsapp_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'whatsapp_opt_in_at') THEN
    ALTER TABLE customers ADD COLUMN whatsapp_opt_in_at TIMESTAMPTZ;
  END IF;
END $$;

-- 2. Create whatsapp_outbox table (adapted for Cow Fresh integer PKs)
CREATE TABLE IF NOT EXISTS whatsapp_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id INTEGER REFERENCES customers(id) ON DELETE SET NULL,
  to_phone TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('receipt', 'order_status', 'payment_reminder', 'text')),
  payload JSONB NOT NULL,
  related_order_id INTEGER REFERENCES sales(id) ON DELETE SET NULL,
  dedupe_key TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'sending', 'sent', 'delivered', 'read', 'failed', 'skipped')),
  attempts INT NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  provider_message_id TEXT,
  last_error TEXT,
  source TEXT NOT NULL DEFAULT 'live' CHECK (source IN ('live', 'test')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_status_next ON whatsapp_outbox (status, next_attempt_at);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_provider_msg_id ON whatsapp_outbox (provider_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_outbox_related_order ON whatsapp_outbox (related_order_id);

-- 3. Create whatsapp_events table for inbound events & webhook logs
CREATE TABLE IF NOT EXISTS whatsapp_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  provider_message_id TEXT,
  from_phone TEXT,
  body TEXT,
  raw JSONB NOT NULL,
  dedupe_key TEXT UNIQUE NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_whatsapp_events_prov_msg ON whatsapp_events (provider_message_id);

-- 4. Enable Row Level Security (deny anon and public, protect data)
ALTER TABLE whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE whatsapp_events ENABLE ROW LEVEL SECURITY;

-- Read policy for authenticated users (admins/cashiers can view logs if needed)
DROP POLICY IF EXISTS "Allow authenticated read outbox" ON whatsapp_outbox;
CREATE POLICY "Allow authenticated read outbox"
  ON whatsapp_outbox FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Allow authenticated read events" ON whatsapp_events;
CREATE POLICY "Allow authenticated read events"
  ON whatsapp_events FOR SELECT
  TO authenticated
  USING (true);

-- 5. Stored function for worker outbox locking & batch claiming
CREATE OR REPLACE FUNCTION claim_whatsapp_outbox(batch_size INT DEFAULT 5)
RETURNS SETOF whatsapp_outbox
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE whatsapp_outbox o
  SET status = 'sending', attempts = attempts + 1
  WHERE o.id IN (
    SELECT id FROM whatsapp_outbox
    WHERE status = 'pending' AND next_attempt_at <= now()
    ORDER BY created_at
    FOR UPDATE SKIP LOCKED
    LIMIT batch_size
  )
  RETURNING o.*;
$$;

REVOKE ALL ON FUNCTION claim_whatsapp_outbox(INT) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_whatsapp_outbox(INT) TO service_role;
