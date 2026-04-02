CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  name text NOT NULL,
  company text,
  email text NOT NULL,
  phone text,
  country text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clients_agency" ON clients
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies 
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));
