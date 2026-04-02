import { createClient } from "@/lib/supabase/server";
import { auth } from "@clerk/nextjs/server";

export async function getCurrentAgency() {
  const { orgId } = await auth();
  
  if (!orgId) return null;

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from("agencies")
    .select("*")
    .eq("clerk_org_id", orgId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}
