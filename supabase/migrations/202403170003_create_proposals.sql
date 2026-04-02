CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  title text NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','viewed','accepted','rejected')),
  brief_raw text,
  executive_summary text,
  scope_statement text,
  assumptions text[],
  out_of_scope text[],
  total_price numeric(12,2) NOT NULL DEFAULT 0,
  currency text DEFAULT 'USD',
  timeline_weeks int,
  sent_at timestamptz,
  viewed_at timestamptz,
  accepted_at timestamptz,
  pdf_url text,
  share_token text UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proposals_agency" ON proposals
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies 
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));

CREATE TABLE IF NOT EXISTS proposal_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  title text NOT NULL,
  description text,
  quantity numeric(8,2) DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  currency text DEFAULT 'USD'
);

ALTER TABLE proposal_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "items_via_proposal" ON proposal_items
  FOR ALL USING (proposal_id IN (
    SELECT id FROM proposals 
    WHERE agency_id IN (
      SELECT id FROM agencies 
      WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
    )
  ));

CREATE TABLE IF NOT EXISTS proposal_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  phase_name text NOT NULL,
  duration_weeks int NOT NULL,
  milestones text[]
);

ALTER TABLE proposal_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "phases_via_proposal" ON proposal_phases
  FOR ALL USING (proposal_id IN (
    SELECT id FROM proposals 
    WHERE agency_id IN (
      SELECT id FROM agencies 
      WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
    )
  ));
