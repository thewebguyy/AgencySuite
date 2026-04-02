import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createPortalSession } from "@/lib/billing/stripe";
import { getCurrentAgency } from "@/lib/auth/agency";

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
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
    return NextResponse.json(
      { error: "No billing account found. Please subscribe to a plan first." },
      { status: 400 }
    );
  }

  try {
    const session = await createPortalSession(sub.stripe_customer_id);
    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Portal error:", error);
    return NextResponse.json(
      { error: "Failed to create billing portal session" },
      { status: 500 }
    );
  }
}
