CREATE TABLE IF NOT EXISTS client_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  contract_id uuid UNIQUE REFERENCES contracts(id),
  slug text UNIQUE NOT NULL,
  portal_token text UNIQUE NOT NULL,
  is_active bool DEFAULT true,
  welcome_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE client_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "portals_agency" ON client_portals
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies 
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));

CREATE POLICY "portals_client_token" ON client_portals
  FOR SELECT USING (portal_token = current_setting('request.jwt.claims', true)::json->>'portal_token');

CREATE TABLE IF NOT EXISTS portal_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid NOT NULL REFERENCES client_portals(id) ON DELETE CASCADE,
  uploaded_by text NOT NULL CHECK (uploaded_by IN ('agency','client')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size int,
  needs_approval bool DEFAULT false,
  approval_status text DEFAULT 'pending' CHECK (approval_status IN ('pending','approved','revision_requested')),
  approved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE portal_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_via_portal_agency" ON portal_files
  FOR ALL USING (portal_id IN (
    SELECT id FROM client_portals 
    WHERE agency_id IN (
      SELECT id FROM agencies 
      WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
    )
  ));

CREATE POLICY "files_via_portal_token" ON portal_files
  FOR SELECT USING (portal_id IN (
    SELECT id FROM client_portals 
    WHERE portal_token = current_setting('request.jwt.claims', true)::json->>'portal_token'
  ));
