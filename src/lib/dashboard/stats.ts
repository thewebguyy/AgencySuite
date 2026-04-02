import { createClient } from "@/lib/supabase/server";
import { subHours } from "date-fns";

export async function getDashboardStats(agencyId: string) {
  const supabase = await createClient();

  // 1. Action Queue
  const [
    { count: pendingReportsCount },
    { data: awaitingProposals },
    { data: overdueInvoices }
  ] = await Promise.all([
    supabase
      .from("status_reports")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "pending"),
    supabase
      .from("proposals")
      .select("id, title, sent_at")
      .eq("agency_id", agencyId)
      .eq("status", "sent")
      .lt("sent_at", subHours(new Date(), 48).toISOString()),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, currency, due_date, client:clients(name)")
      .eq("agency_id", agencyId)
      .eq("status", "sent")
      .lt("due_date", new Date().toISOString().split("T")[0])
  ]);

  // 2. Pipeline Pulse (Current Month)
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const [
    { count: proposalsSentCount },
    { count: proposalsAcceptedCount },
    { count: activeProjectsCount },
    { count: reportsGeneratedCount }
  ] = await Promise.all([
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .gte("sent_at", startOfMonth.toISOString()),
    supabase
      .from("proposals")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .gte("accepted_at", startOfMonth.toISOString()),
    supabase
      .from("contracts")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .eq("status", "signed"),
    supabase
      .from("reports")
      .select("*", { count: "exact", head: true })
      .eq("agency_id", agencyId)
      .gte("created_at", startOfMonth.toISOString())
  ]);

  const winRate = proposalsSentCount ? (proposalsAcceptedCount || 0) / proposalsSentCount : 0;

  return {
    actionQueue: {
      pendingReports: pendingReportsCount || 0,
      awaitingProposals: awaitingProposals?.length || 0,
      overdueInvoices: overdueInvoices || []
    },
    pulse: {
      sent: proposalsSentCount || 0,
      accepted: proposalsAcceptedCount || 0,
      winRate: Math.round(winRate * 100),
      activeProjects: activeProjectsCount || 0,
      reportsGenerated: reportsGeneratedCount || 0
    }
  };
}

export async function getRecentActivity(agencyId: string) {
  const supabase = await createClient();

  const [
    { data: proposalViews },
    { data: proposalAcceptances },
    { data: contractSignings },
    { data: fileApprovals },
    { data: invoicePayments },
    { data: recentReports }
  ] = await Promise.all([
    supabase.from("proposals").select("id, title, viewed_at").eq("agency_id", agencyId).not("viewed_at", "is", null).order("viewed_at", { ascending: false }).limit(5),
    supabase.from("proposals").select("id, title, accepted_at").eq("agency_id", agencyId).not("accepted_at", "is", null).order("accepted_at", { ascending: false }).limit(5),
    supabase.from("contracts").select("id, signed_at").eq("agency_id", agencyId).not("signed_at", "is", null).order("signed_at", { ascending: false }).limit(5),
    supabase.from("portal_files").select("id, file_name, approved_at, portal:client_portals(agency_id)").eq("portal.agency_id", agencyId).not("approved_at", "is", null).order("approved_at", { ascending: false }).limit(5),
    supabase.from("invoices").select("id, invoice_number, total, currency, paid_at").eq("agency_id", agencyId).not("paid_at", "is", null).order("paid_at", { ascending: false }).limit(5),
    supabase.from("reports").select("id, client_name, reporting_period, created_at").eq("agency_id", agencyId).eq("status", "generated").order("created_at", { ascending: false }).limit(5)
  ]);

  const activities = [
    ...(proposalViews || []).map(p => ({ type: 'view', title: 'Proposal Viewed', detail: p.title, date: p.viewed_at })),
    ...(proposalAcceptances || []).map(p => ({ type: 'accept', title: 'Proposal Accepted', detail: p.title, date: p.accepted_at })),
    ...(contractSignings || []).map(c => ({ type: 'sign', title: 'Contract Signed', detail: `Contract #${c.id.slice(0, 8)}`, date: c.signed_at })),
    ...(fileApprovals || []).map(f => ({ type: 'file', title: 'File Approved', detail: f.file_name, date: f.approved_at })),
    ...(invoicePayments || []).map(i => ({ type: 'payment', title: 'Invoice Paid', detail: `${i.invoice_number} (${i.currency} ${i.total})`, date: i.paid_at })),
    ...(recentReports || []).map(r => ({ type: 'report', title: 'Report Generated', detail: `${r.client_name} — ${r.reporting_period}`, date: r.created_at }))
  ].sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime()).slice(0, 10);

  return activities;
}
