import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: Request) {
  const { orgId } = await auth();
  if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const body = await req.json();
  
  const { 
    id,
    clientId, 
    title, 
    executiveSummary, 
    scopeStatement, 
    deliverables, 
    phases, 
    assumptions, 
    outOfScope,
    totalPrice,
    currency,
    status
  } = body;

  const { data: agency } = await supabase.from("agencies").select("id").eq("clerk_org_id", orgId).single();
  if (!agency) return new NextResponse("Agency not found", { status: 404 });

  const proposalData = {
    agency_id: agency.id,
    client_id: clientId,
    title,
    executive_summary: executiveSummary,
    scope_statement: scopeStatement,
    assumptions,
    out_of_scope: outOfScope,
    total_price: totalPrice,
    currency,
    status: status || 'draft',
    share_token: id === 'new' ? uuidv4() : undefined
  };

  let proposalId = id;

  if (id === 'new') {
    const { data, error } = await supabase.from("proposals").insert(proposalData).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    proposalId = data.id;
  } else {
    const { error } = await supabase.from("proposals").update(proposalData).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Handle items (Wipe and replace for simplicity in MVP)
  await supabase.from("proposal_items").delete().eq("proposal_id", proposalId);
  const { error: itemsError } = await supabase.from("proposal_items").insert(
    deliverables.map((d: any, i: number) => ({
      proposal_id: proposalId,
      sort_order: i,
      title: d.title,
      description: d.description,
      quantity: d.quantity,
      unit_price: d.unitPrice,
      currency
    }))
  );

  // Handle phases
  await supabase.from("proposal_phases").delete().eq("proposal_id", proposalId);
  const { error: phasesError } = await supabase.from("proposal_phases").insert(
    phases.map((p: any, i: number) => ({
      proposal_id: proposalId,
      sort_order: i,
      phase_name: p.phaseName,
      duration_weeks: p.durationWeeks,
      milestones: p.milestones
    }))
  );

  if (itemsError || phasesError) {
    return NextResponse.json({ error: "Failed to save child records" }, { status: 500 });
  }

  return NextResponse.json({ id: proposalId });
}
