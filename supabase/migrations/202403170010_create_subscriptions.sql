CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL UNIQUE REFERENCES agencies(id) ON DELETE CASCADE,

  stripe_customer_id text UNIQUE,
  stripe_subscription_id text UNIQUE,
  plan text NOT NULL DEFAULT 'trial' CHECK (plan IN ('trial','starter','agency_suite','scale')),
  status text NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing','active','past_due','canceled','unpaid')),

  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  current_period_end timestamptz,

  reports_generated_this_month int DEFAULT 0,
  proposals_generated_this_month int DEFAULT 0,
  monthly_reset_at timestamptz DEFAULT (date_trunc('month', now()) + interval '1 month'),

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "subscriptions_agency" ON subscriptions
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));

CREATE INDEX idx_subscriptions_agency_id ON subscriptions(agency_id);
CREATE INDEX idx_subscriptions_stripe_customer ON subscriptions(stripe_customer_id);
