import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/billing/stripe";
import { getCurrentAgency } from "@/lib/auth/agency";
import { logError, logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const context = { route: "/api/billing/portal", method: "POST" };

  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agency = await getCurrentAgency();
    if (!agency) {
      return NextResponse.json({ error: "Agency not found" }, { status: 404 });
    }

    const supabase = await createClient();

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id")
      .eq("agency_id", agency.id)
      .single();

    if (!sub?.stripe_customer_id) {
      logInfo("No billing account found for agency", { agencyId: agency.id, ...context });
      return NextResponse.json(
        { error: "No billing account found. Please subscribe to a plan first." },
        { status: 400 }
      );
    }

    logInfo("Creating portal session", { userId, agencyId: agency.id });
    const session = await createPortalSession(sub.stripe_customer_id);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    logError("PORTAL_ERROR", error, context);
    return NextResponse.json(
      { error: "Internal Server Error", code: "STRIPE_PORTAL_FAILED" },
      { status: 500 }
    );
  }
}

