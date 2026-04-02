CREATE TABLE IF NOT EXISTS status_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  contract_id uuid NOT NULL REFERENCES contracts(id),
  week_number int NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','sent','discarded')),
  ai_draft jsonb,
  edited_content jsonb,
  email_subject text,
  sent_at timestamptz,
  opened_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE status_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_agency" ON status_reports
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies 
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));
