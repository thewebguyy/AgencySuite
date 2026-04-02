import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Fetch proposal and agency info
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("*, agency:agencies(*)")
    .eq("id", id)
    .single();

  if (fetchError || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  if (proposal.status === 'accepted') {
    return NextResponse.json({ error: "Proposal already accepted" }, { status: 400 });
  }

  // 2. Begin transaction by creating the contract
  const contractData = {
    agency_id: proposal.agency_id,
    proposal_id: proposal.id,
    client_id: proposal.client_id,
    contract_type: 'fixed_price', // Default for MVP
    status: 'draft',
    sign_token: uuidv4(),
    clauses: [
      { id: '1', title: 'Scope of Services', content: proposal.scope_statement },
      { id: '2', title: 'Payment Terms', content: `Total investment of ${proposal.currency} ${proposal.total_price.toLocaleString()} as outlined in the proposal.` },
      { id: '3', title: 'Intellectual Property', content: 'All project deliverables shall become the property of the Client upon final payment.' }
    ],
    governing_law: proposal.agency.billing_country === 'NG' ? 'Lagos, Nigeria' : 'United Kingdom'
  };

  const { data: contract, error: contractError } = await supabase
    .from("contracts")
    .insert(contractData)
    .select()
    .single();

  if (contractError) {
    console.error("Contract Error", contractError);
    return NextResponse.json({ error: "Failed to create contract" }, { status: 500 });
  }

  // 3. Update proposal status
  await supabase
    .from("proposals")
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq("id", id);

  // 4. Return the contract token for redirection
  return NextResponse.json({ 
    success: true, 
    contractToken: contract.sign_token 
  });
}
