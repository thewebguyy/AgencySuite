import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getCurrentAgency } from "@/lib/auth/agency";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const agency = await getCurrentAgency();
  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.agencyName || !body.clientName || !body.reportingPeriod) {
    return NextResponse.json(
      { error: "Missing required fields: agencyName, clientName, reportingPeriod" },
      { status: 400 }
    );
  }

  const supabase = await createClient();

  const reportData = {
    ...(body.id ? { id: body.id } : {}),
    agency_id: agency.id,
    client_id: body.clientId || null,
    agency_name: body.agencyName,
    client_name: body.clientName,
    reporting_period: body.reportingPeriod,
    services: body.services || [],
    metrics: body.metrics || {},
    wins: body.wins || [],
    challenges: body.challenges || [],
    next_steps: body.nextSteps || [],
    tone: body.tone || "professional",
    generated_content: body.generatedContent || null,
    status: body.generatedContent ? "generated" : "draft",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("reports")
    .upsert(reportData)
    .select()
    .single();

  if (error) {
    console.error("Save report error:", error);
    return NextResponse.json({ error: "Failed to save report" }, { status: 500 });
  }

  return NextResponse.json({ report: data });
}
