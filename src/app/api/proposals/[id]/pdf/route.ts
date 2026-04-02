import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import puppeteer from "puppeteer";

export const runtime = "nodejs"; // Puppeteer requires Node.js

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { orgId } = await auth();
  if (!orgId) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = await createClient();

  // Load proposal with components needed for PDF
  const { data: proposal, error } = await supabase
    .from("proposals")
    .select("*, agency:agencies(*), client:clients(*), proposal_items(*), proposal_phases(*)")
    .eq("id", id)
    .single();

  if (error || !proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    
    // In a real app, you'd render a special React component to HTML
    // For MVP, we'll generate direct HTML that looks like the public view
    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid ${proposal.agency.brand_color || '#5B5BD6'}; padding-bottom: 20px; margin-bottom: 40px; }
            .title { font-size: 32px; font-weight: bold; margin: 0; }
            .subtitle { font-size: 18px; color: #666; margin-top: 10px; }
            .section { margin-bottom: 40px; }
            .section-title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #888; margin-bottom: 10px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #ddd; padding: 10px 0; font-size: 12px; color: #888; }
            td { padding: 15px 0; border-bottom: 1px solid #eee; }
            .total { font-size: 20px; font-weight: bold; text-align: right; padding-top: 20px; }
            .phase-card { border: 1px solid #eee; padding: 15px; margin-bottom: 15px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="title">${proposal.title}</h1>
            <p class="subtitle">For ${proposal.client.company || proposal.client.name}</p>
          </div>
          
          <div class="section">
            <div class="section-title">Executive Summary</div>
            <p>${proposal.executive_summary}</p>
          </div>

          <div class="section">
            <div class="section-title">Scope of Work</div>
            <p>${proposal.scope_statement}</p>
          </div>

          <div class="section">
            <div class="section-title">Deliverables</div>
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th style="text-align: right;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${proposal.proposal_items.map((i: any) => `
                  <tr>
                    <td>
                      <strong>${i.title}</strong><br/>
                      <small>${i.description}</small>
                    </td>
                    <td style="text-align: right;">${proposal.currency} ${(i.unit_price * i.quantity).toLocaleString()}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div class="total">Total: ${proposal.currency} ${proposal.total_price.toLocaleString()}</div>
          </div>

          <div class="section">
            <div class="section-title">Timeline</div>
            ${proposal.proposal_phases.map((p: any) => `
              <div class="phase-card">
                <strong>${p.phase_name} (${p.duration_weeks} weeks)</strong>
                <ul>
                  ${p.milestones.map((m: string) => `<li>${m}</li>`).join('')}
                </ul>
              </div>
            `).join('')}
          </div>
        </body>
      </html>
    `;

    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // Store in Supabase
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('proplo')
      .upload(`proposals/${proposal.agency_id}/${proposal.id}.pdf`, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage.from('proplo').getPublicUrl(`proposals/${proposal.agency_id}/${proposal.id}.pdf`);

    return NextResponse.json({ success: true, url: publicUrl });

  } catch (err: any) {
    console.error("PDF generation failed", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
