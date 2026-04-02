-- Schema updates for Proplo MVP

-- Add is_archived to clients
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Add revision_comment to portal_files
ALTER TABLE portal_files ADD COLUMN IF NOT EXISTS revision_comment text;

-- Add reminders tracking to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS last_reminder_sent_at timestamptz;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_count int NOT NULL DEFAULT 0;

-- Create processed_webhook_events table
CREATE TABLE IF NOT EXISTS processed_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL, -- 'stripe' or 'paystack'
  event_id text NOT NULL,
  processed_at timestamptz DEFAULT now(),
  UNIQUE(provider, event_id)
);

-- Use a more standard policy for processed_webhook_events (not tied to agency for now as they are system events)
ALTER TABLE processed_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_access" ON processed_webhook_events
  FOR ALL TO service_role USING (true);
