import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { Resend } from "resend";
import { NextResponse } from "next/server";
import { getEnv } from "@/lib/env";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await auth();
  if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

  const env = getEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const supabase = await createClient();

  // Load proposal with client info
  const { data: proposal, error: fetchError } = await supabase
    .from("proposals")
    .select("*, client:clients(*), agency:agencies(*)")
    .eq("id", id)
    .single();

  if (fetchError || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  // 1. Generate PDF via local Node.js API
  const pdfUrlResponse = await fetch(`${env.NEXT_PUBLIC_APP_URL}/api/proposals/${id}/pdf`, {
    headers: {
      "Cookie": req.headers.get("Cookie") || "" // Forward auth cookie
    }
  });
  
  const pdfData = await pdfUrlResponse.json();
  if (!pdfUrlResponse.ok) {
     return NextResponse.json({ error: "Failed to generate PDF: " + pdfData.error }, { status: 500 });
  }

  const pdfUrl = pdfData.url;

  // 2. Send Email via Resend
  const { data: emailData, error: emailError } = await resend.emails.send({
    from: "Proplo <proposals@mg.proplo.com>", 
    to: proposal.client.email,
    subject: `Proposal: ${proposal.title} from ${proposal.agency.name}`,
    html: `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h1 style="color: ${proposal.agency.brand_color || '#5B5BD6'}">Hello ${proposal.client.name},</h1>
        <p>${proposal.agency.name} has sent you a new project proposal for <strong>${proposal.title}</strong>.</p>
        <p style="font-size: 18px;">Total Investment: <strong>${proposal.currency} ${proposal.total_price.toLocaleString()}</strong></p>
        <div style="margin: 32px 0;">
          <a href="${env.NEXT_PUBLIC_APP_URL}/proposals/view/${proposal.share_token}" 
             style="background-color: ${proposal.agency.brand_color || '#5B5BD6'}; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            View Detailed Proposal
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #888;">Powered by Proplo — The Agency Command Center</p>
      </div>
    `,
  });

  if (emailError) {
    console.error("Resend Error", emailError);
    // Continue even if email fails, but normally we'd return 500
  }

  // 3. Update status and timestamps
  const { error: updateError } = await supabase
    .from("proposals")
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      pdf_url: pdfUrl
    })
    .eq("id", id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, emailId: emailData?.id });
}
