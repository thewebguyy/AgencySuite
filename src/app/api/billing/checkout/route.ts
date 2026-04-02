import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { logError, logInfo } from "@/lib/logger";

export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getCurrentAgency } from "@/lib/auth/agency";
import {
  getOrCreateCustomer,
  createCheckoutSession,
  PLANS,
  type PlanKey,
} from "@/lib/billing/stripe";

export async function POST(req: Request) {
  const context = { route: "/api/billing/checkout", method: "POST" };

  try {
    const { userId, orgId } = await auth();
    if (!userId || !orgId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const agency = await getCurrentAgency();
    if (!agency) {
      logWarning("Agency not found for user", { userId, orgId, ...context });
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
      logError("Plan pricing not configured", new Error(`Missing priceId for plan: ${plan}`), {
        plan,
        ...context,
      });
      return NextResponse.json(
        { error: "Plan pricing not configured. Contact support." },
        { status: 500 }
      );
    }

    const user = await currentUser();
    const email =
      user?.emailAddresses?.[0]?.emailAddress || `agency-${agency.id}@placeholder.com`;

    logInfo("Creating checkout session", { userId, agencyId: agency.id, plan, ...context });

    const customer = await getOrCreateCustomer(email, agency.name);
    const session = await createCheckoutSession(
      customer.id,
      planConfig.priceId,
      agency.id
    );

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    logError("CHECKOUT_ERROR", error, { ...context });
    
    // Safety check: don't leak Stripe raw errors if possible, 
    // but give enough context for the user.
    return NextResponse.json(
      { error: "Internal Server Error", code: "STRIPE_CHECKOUT_FAILED" },
      { status: 500 }
    );
  }
}

function logWarning(message: string, context: any) {
  console.warn(JSON.stringify({ level: "warn", message, ...context }));
}

