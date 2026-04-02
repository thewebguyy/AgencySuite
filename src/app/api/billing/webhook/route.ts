import { NextResponse } from "next/server";
import { getStripe } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getEnv } from "@/lib/env";
import { logError, logInfo } from "@/lib/logger";
import type Stripe from "stripe";

// Webhook must use raw body — disable body parsing
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: Request) {
  const context = { route: "/api/billing/webhook", method: "POST" };
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const env = getEnv();

  if (!sig) {
    logError("Missing stripe-signature header", new Error("No signature"), context);
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    logError("Webhook signature verification failed", err, context);
    return new NextResponse(`Webhook Error: ${message}`, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    logInfo(`Processing Stripe event: ${event.type}`, { eventId: event.id, ...context });

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const agencyId = session.metadata?.agencyId;
        if (!agencyId) {
          logError("Missing agencyId in checkout metadata", new Error("Incomplete metadata"), { sessionId: session.id, ...context });
          break;
        }

        const { error } = await supabase.from("subscriptions").upsert({
          agency_id: agencyId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: "active",
          updated_at: new Date().toISOString(),
        });

        if (error) {
          logError("Failed to upsert subscription", error, { agencyId, ...context });
          throw error;
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const agencyId = sub.metadata?.agencyId;
        if (!agencyId) break;

        // Map Stripe price to our plan key
        const priceId = sub.items.data[0]?.price?.id;
        let plan = "starter";
        if (priceId === env.STRIPE_AGENCY_SUITE_PRICE_ID) plan = "agency_suite";
        else if (priceId === env.STRIPE_SCALE_PRICE_ID) plan = "scale";

        const periodEnd = (sub as any).current_period_end;
        const { error } = await supabase
          .from("subscriptions")
          .update({
            plan,
            status: sub.status === "active" ? "active" : sub.status,
            current_period_end: periodEnd
              ? new Date(periodEnd * 1000).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) {
          logError("Failed to update subscription", error, { subId: sub.id, ...context });
          throw error;
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);

        if (error) {
          logError("Failed to delete/cancel subscription", error, { subId: sub.id, ...context });
          throw error;
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = typeof (invoice as any).subscription === "string" 
          ? (invoice as any).subscription 
          : (invoice as any).subscription?.id || null;

        if (!subscriptionId) break;

        const { error } = await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);

        if (error) {
          logError("Failed to mark subscription as past_due", error, { subscriptionId, ...context });
          throw error;
        }
        break;
      }
    }
  } catch (err) {
    logError("Webhook processing error", err, context);
    // Return 200 for now to avoid Stripe retrying logic errors indefinitely, 
    // unless it's a transient connection error.
  }

  return NextResponse.json({ received: true });
}
