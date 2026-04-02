"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";
import { PLANS, type PlanKey } from "@/lib/billing/stripe";
import {
  Check,
  Loader2,
  CreditCard,
  ExternalLink,
  Sparkles,
} from "lucide-react";

const PLAN_ORDER: PlanKey[] = ["starter", "agency_suite", "scale"];

export default function BillingPage() {
  const [subscription, setSubscription] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    fetchSubscription();
  }, []);

  async function fetchSubscription() {
    const { data } = await supabase
      .from("subscriptions")
      .select("*")
      .limit(1)
      .single();

    setSubscription(data);
    setLoading(false);
  }

  const currentPlan: PlanKey = subscription?.plan || "trial";
  const isActive =
    !subscription ||
    subscription.status === "trialing" ||
    subscription.status === "active";

  async function handleCheckout(plan: PlanKey) {
    setCheckoutLoading(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Checkout Failed",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/billing/portal", {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      toast({
        title: "Portal Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setPortalLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-mid" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-dark tracking-tight">Billing</h1>
        <p className="text-mid">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand" />
                Current Plan
              </CardTitle>
              <CardDescription className="mt-1">
                {currentPlan === "trial" ? (
                  <>
                    Free Trial
                    {subscription?.trial_ends_at && (
                      <span className="ml-1">
                        · Expires{" "}
                        {new Date(subscription.trial_ends_at).toLocaleDateString()}
                      </span>
                    )}
                  </>
                ) : (
                  <>
                    {PLANS[currentPlan].name} — $
                    {PLANS[currentPlan].price}/mo
                  </>
                )}
              </CardDescription>
            </div>
            <Badge
              variant={isActive ? "success" : "error"}
            >
              {subscription?.status || "trialing"}
            </Badge>
          </div>
        </CardHeader>
        {subscription?.stripe_customer_id && (
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePortal}
              disabled={portalLoading}
              className="gap-2"
            >
              {portalLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5" />
              )}
              Manage Billing
            </Button>
          </CardContent>
        )}
      </Card>

      {/* Usage */}
      {subscription && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-mid uppercase tracking-wider font-medium mb-1">
                  Reports Generated
                </p>
                <p className="text-2xl font-bold text-dark">
                  {subscription.reports_generated_this_month || 0}
                  <span className="text-sm text-mid font-normal ml-1">
                    /{" "}
                    {PLANS[currentPlan].limits.reports === -1
                      ? "∞"
                      : PLANS[currentPlan].limits.reports}
                  </span>
                </p>
              </div>
              <div>
                <p className="text-xs text-mid uppercase tracking-wider font-medium mb-1">
                  Proposals Generated
                </p>
                <p className="text-2xl font-bold text-dark">
                  {subscription.proposals_generated_this_month || 0}
                  <span className="text-sm text-mid font-normal ml-1">
                    /{" "}
                    {PLANS[currentPlan].limits.proposals === -1
                      ? "∞"
                      : PLANS[currentPlan].limits.proposals}
                  </span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans */}
      <div>
        <h2 className="text-sm font-semibold text-mid uppercase tracking-widest mb-4">
          Available Plans
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLAN_ORDER.map((planKey) => {
            const plan = PLANS[planKey];
            const isCurrent = currentPlan === planKey;
            const isPopular = planKey === "agency_suite";

            return (
              <Card
                key={planKey}
                className={`relative ${
                  isPopular ? "border-brand border-2" : ""
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3 left-4">
                    <Badge variant="brand" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-dark">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-mid">/month</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-6">
                    <PlanFeature>
                      {plan.limits.reports === -1
                        ? "Unlimited"
                        : plan.limits.reports}{" "}
                      reports/month
                    </PlanFeature>
                    <PlanFeature>
                      {plan.limits.proposals === -1
                        ? "Unlimited"
                        : plan.limits.proposals}{" "}
                      proposals/month
                    </PlanFeature>
                    <PlanFeature>
                      {plan.limits.clients === -1
                        ? "Unlimited"
                        : plan.limits.clients}{" "}
                      clients
                    </PlanFeature>
                    {planKey === "scale" && (
                      <PlanFeature>White-label reports</PlanFeature>
                    )}
                  </ul>

                  {isCurrent ? (
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled
                    >
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={isPopular ? "primary" : "outline"}
                      className="w-full gap-2"
                      onClick={() => handleCheckout(planKey)}
                      disabled={!!checkoutLoading}
                    >
                      {checkoutLoading === planKey ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : null}
                      {isCurrent ? "Current Plan" : "Subscribe"}
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PlanFeature({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2 text-sm text-dark/80">
      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      {children}
    </li>
  );
}
