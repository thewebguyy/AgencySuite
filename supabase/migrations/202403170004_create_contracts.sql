CREATE TABLE IF NOT EXISTS contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  proposal_id uuid UNIQUE REFERENCES proposals(id),
  client_id uuid NOT NULL REFERENCES clients(id),
  contract_type text NOT NULL CHECK (contract_type IN ('fixed_price','retainer','time_and_materials')),
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','signed','voided')),
  clauses jsonb NOT NULL DEFAULT '[]',
  payment_terms text,
  revision_policy text,
  governing_law text,
  sent_at timestamptz,
  signed_at timestamptz,
  pdf_url text,
  sign_token text UNIQUE,
  sign_token_expires timestamptz
);

ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contracts_agency" ON contracts
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies 
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));

CREATE TABLE IF NOT EXISTS contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
  signer_type text NOT NULL CHECK (signer_type IN ('agency','client')),
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signature_data text,
  signature_hash text,
  ip_address text,
  user_agent text,
  signed_at timestamptz DEFAULT now()
);

ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sigs_agency" ON contract_signatures
  FOR ALL USING (contract_id IN (
    SELECT id FROM contracts 
    WHERE agency_id IN (
      SELECT id FROM agencies 
      WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
    )
  ));
