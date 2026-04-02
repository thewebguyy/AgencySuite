import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getCurrentAgency } from "@/lib/auth/agency";
import {
  getOrCreateCustomer,
  createCheckoutSession,
  PLANS,
  type PlanKey,
} from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const { userId, orgId } = await auth();
  if (!userId || !orgId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const agency = await getCurrentAgency();
  if (!agency) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }

  let body: { plan: PlanKey };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const plan = body.plan;
  if (!plan || !PLANS[plan] || plan === "trial") {
    return NextResponse.json({ error: "Invalid plan selected" }, { status: 400 });
  }

  const planConfig = PLANS[plan];
  if (!planConfig.priceId) {
    return NextResponse.json(
      { error: "Plan pricing not configured. Contact support." },
      { status: 500 }
    );
  }

  try {
    const user = await currentUser();
    const email =
      user?.emailAddresses?.[0]?.emailAddress || `agency-${agency.id}@placeholder.com`;

    const customer = await getOrCreateCustomer(email, agency.name);
    const session = await createCheckoutSession(
      customer.id,
      planConfig.priceId,
      agency.id
    );

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
