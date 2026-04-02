import { createClient } from "@/lib/supabase/server";
import { PLANS, type PlanKey } from "./stripe";

export type FeatureType = "report" | "proposal";

interface GateResult {
  allowed: boolean;
  reason?: string;
  currentPlan?: PlanKey;
}

/**
 * Check if an agency can use a feature based on their subscription.
 * Returns { allowed: true } if the action is permitted.
 */
export async function checkFeatureAccess(
  agencyId: string,
  feature: FeatureType
): Promise<GateResult> {
  const supabase = await createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("agency_id", agencyId)
    .single();

  // No subscription record → treat as trial (allow with limits)
  if (!sub) {
    return { allowed: true, currentPlan: "trial" };
  }

  const plan = sub.plan as PlanKey;
  const planConfig = PLANS[plan];

  // Check subscription status
  if (sub.status === "canceled" || sub.status === "unpaid") {
    return {
      allowed: false,
      reason: "Your subscription is inactive. Please update your billing.",
      currentPlan: plan,
    };
  }

  // Check trial expiry
  if (sub.status === "trialing" && sub.trial_ends_at) {
    const trialEnd = new Date(sub.trial_ends_at);
    if (trialEnd < new Date()) {
      return {
        allowed: false,
        reason: "Your free trial has expired. Please subscribe to continue.",
        currentPlan: plan,
      };
    }
  }

  // Check usage limits
  if (planConfig.limits) {
    const limitKey = feature === "report" ? "reports" : "proposals";
    const usageKey =
      feature === "report"
        ? "reports_generated_this_month"
        : "proposals_generated_this_month";
    const limit = planConfig.limits[limitKey];
    const usage = (sub as any)[usageKey] || 0;

    // -1 means unlimited
    if (limit !== -1 && usage >= limit) {
      return {
        allowed: false,
        reason: `You've reached your monthly ${feature} limit (${limit}). Upgrade your plan for more.`,
        currentPlan: plan,
      };
    }
  }

  return { allowed: true, currentPlan: plan };
}

/**
 * Increment the usage counter for a feature after successful generation.
 */
export async function incrementUsage(
  agencyId: string,
  feature: FeatureType
): Promise<void> {
  const supabase = await createClient();

  const column =
    feature === "report"
      ? "reports_generated_this_month"
      : "proposals_generated_this_month";

  // Fetch current count, then increment
  const { data: sub } = await supabase
    .from("subscriptions")
    .select(column)
    .eq("agency_id", agencyId)
    .single();

  if (sub) {
    const current = (sub as any)[column] || 0;
    await supabase
      .from("subscriptions")
      .update({ [column]: current + 1, updated_at: new Date().toISOString() })
      .eq("agency_id", agencyId);
  }
}
