CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id uuid REFERENCES clients(id) ON DELETE SET NULL,

  agency_name text NOT NULL,
  client_name text NOT NULL,
  reporting_period text NOT NULL,
  services text[] NOT NULL DEFAULT '{}',
  metrics jsonb NOT NULL DEFAULT '{}',
  wins text[] NOT NULL DEFAULT '{}',
  challenges text[] NOT NULL DEFAULT '{}',
  next_steps text[] NOT NULL DEFAULT '{}',
  tone text NOT NULL DEFAULT 'professional' CHECK (tone IN ('professional','casual','executive')),

  generated_content text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','generated','sent')),

  sent_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_agency" ON reports
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));

CREATE INDEX idx_reports_agency_id ON reports(agency_id);
CREATE INDEX idx_reports_created_at ON reports(created_at DESC);
