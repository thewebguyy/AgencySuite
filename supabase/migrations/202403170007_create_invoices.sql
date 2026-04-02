CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES clients(id),
  proposal_id uuid REFERENCES proposals(id),
  invoice_number text UNIQUE NOT NULL,
  status text DEFAULT 'draft' CHECK (status IN ('draft','sent','paid','overdue','voided')),
  currency text NOT NULL,
  subtotal numeric(12,2) NOT NULL,
  tax_rate numeric(5,2) DEFAULT 0,
  tax_amount numeric(12,2) NOT NULL DEFAULT 0,
  discount_amount numeric(12,2) DEFAULT 0,
  total numeric(12,2) NOT NULL,
  payment_provider text NOT NULL CHECK (payment_provider IN ('stripe','paystack')),
  payment_url text,
  payment_reference text,
  due_date date NOT NULL,
  sent_at timestamptz,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_agency" ON invoices
  FOR ALL USING (agency_id IN (
    SELECT id FROM agencies 
    WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
  ));

CREATE TABLE IF NOT EXISTS invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  sort_order int NOT NULL,
  description text NOT NULL,
  quantity numeric(8,2) DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  amount numeric(12,2) NOT NULL
);

ALTER TABLE invoice_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "line_items_via_invoice" ON invoice_line_items
  FOR ALL USING (invoice_id IN (
    SELECT id FROM invoices 
    WHERE agency_id IN (
      SELECT id FROM agencies 
      WHERE clerk_org_id = (auth.jwt() ->> 'org_id')
    )
  ));
