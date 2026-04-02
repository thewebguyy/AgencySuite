import { NextResponse } from "next/server";
import { stripe } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

// Webhook must use raw body — disable body parsing
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig) {
    return new NextResponse("Missing stripe-signature header", { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const supabase = createAdminClient();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const agencyId = session.metadata?.agencyId;
        if (!agencyId) break;

        await supabase.from("subscriptions").upsert({
          agency_id: agencyId,
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          status: "active",
          updated_at: new Date().toISOString(),
        });
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const agencyId = sub.metadata?.agencyId;
        if (!agencyId) break;

        // Map Stripe price to our plan key
        const priceId = sub.items.data[0]?.price?.id;
        let plan = "starter";
        if (priceId === process.env.STRIPE_AGENCY_SUITE_PRICE_ID) plan = "agency_suite";
        else if (priceId === process.env.STRIPE_SCALE_PRICE_ID) plan = "scale";

        const periodEnd = (sub as any).current_period_end;
        await supabase
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
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await supabase
          .from("subscriptions")
          .update({
            status: "canceled",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const subscriptionId =
          typeof (invoice as any).subscription === "string"
            ? (invoice as any).subscription
            : (invoice as any).subscription?.id || null;
        if (!subscriptionId) break;

        await supabase
          .from("subscriptions")
          .update({
            status: "past_due",
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", subscriptionId);
        break;
      }
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    // Still return 200 to prevent Stripe retries for non-transient errors
  }

  return NextResponse.json({ received: true });
}
