import Stripe from "stripe";
import { env } from "@/lib/env";

let stripeInstance: Stripe | null = null;

export function getStripe() {
  if (stripeInstance) return stripeInstance;

  stripeInstance = new Stripe(env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-12-18.acacia" as any,
  });

  return stripeInstance;
}

// ---------------------------------------------------------------------------
// Plan Configuration
// ---------------------------------------------------------------------------

export const PLANS = {
  trial: {
    name: "Free Trial",
    priceId: null,
    price: 0,
    limits: { reports: 5, proposals: 3, clients: 5 },
  },
  starter: {
    name: "Starter",
    priceId: env.STRIPE_STARTER_PRICE_ID,
    price: 29,
    limits: { reports: 15, proposals: 10, clients: 15 },
  },
  agency_suite: {
    name: "Agency Suite",
    priceId: env.STRIPE_AGENCY_SUITE_PRICE_ID,
    price: 79,
    limits: { reports: -1, proposals: -1, clients: -1 }, // -1 = unlimited
  },
  scale: {
    name: "Scale",
    priceId: env.STRIPE_SCALE_PRICE_ID,
    price: 199,
    limits: { reports: -1, proposals: -1, clients: -1 },
  },
} as const;

export type PlanKey = keyof typeof PLANS;

// ---------------------------------------------------------------------------
// Customer Management
// ---------------------------------------------------------------------------

export async function getOrCreateCustomer(
  email: string,
  name: string
): Promise<Stripe.Customer> {
  const stripe = getStripe();
  const existing = await stripe.customers.list({ email, limit: 1 });
  if (existing.data.length > 0) return existing.data[0];

  return stripe.customers.create({ email, name });
}

// ---------------------------------------------------------------------------
// Checkout Session
// ---------------------------------------------------------------------------

export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  agencyId: string
): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  return stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${env.NEXT_PUBLIC_APP_URL}/billing?success=true`,
    cancel_url: `${env.NEXT_PUBLIC_APP_URL}/billing?canceled=true`,
    metadata: { agencyId },
    subscription_data: {
      metadata: { agencyId },
    },
  });
}

// ---------------------------------------------------------------------------
// Customer Portal
// ---------------------------------------------------------------------------

export async function createPortalSession(
  customerId: string
): Promise<Stripe.BillingPortal.Session> {
  const stripe = getStripe();
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${env.NEXT_PUBLIC_APP_URL}/billing`,
  });
}

