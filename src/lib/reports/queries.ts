import { createClient } from "@/lib/supabase/server";

export async function getReports(agencyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getReport(reportId: string, agencyId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("id", reportId)
    .eq("agency_id", agencyId)
    .single();

  if (error) throw error;
  return data;
}

export async function getReportCount(agencyId: string) {
  const supabase = await createClient();

  const { count, error } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId);

  if (error) throw error;
  return count || 0;
}

export async function getReportsThisMonth(agencyId: string) {
  const supabase = await createClient();

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count, error } = await supabase
    .from("reports")
    .select("*", { count: "exact", head: true })
    .eq("agency_id", agencyId)
    .gte("created_at", startOfMonth.toISOString());

  if (error) throw error;
  return count || 0;
}
