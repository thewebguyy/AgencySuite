CREATE TABLE IF NOT EXISTS agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_org_id text UNIQUE NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  logo_url text,
  brand_color text DEFAULT '#5B5BD6',
  billing_country text DEFAULT 'NG',
  payment_provider text DEFAULT 'paystack' CHECK (payment_provider IN ('stripe', 'paystack')),
  stripe_account_id text,
  paystack_public_key text,
  specializations text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "agency_own" ON agencies
  FOR ALL USING (clerk_org_id = (auth.jwt() ->> 'org_id'));
