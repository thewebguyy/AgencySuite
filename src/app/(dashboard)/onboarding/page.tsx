"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useOrganization, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { createClient } from "@/lib/supabase/client";
import { toast } from "@/hooks/use-toast";

const onboardingSchema = z.object({
  name: z.string().min(2, "Agency name must be at least 2 characters"),
  billingCountry: z.string().min(1, "Please select a country"),
});

type OnboardingValues = z.infer<typeof onboardingSchema>;

const COUNTRIES = [
  { label: "Nigeria", value: "NG" },
  { label: "Ghana", value: "GH" },
  { label: "Kenya", value: "KE" },
  { label: "South Africa", value: "ZA" },
  { label: "United Kingdom", value: "GB" },
  { label: "United States", value: "US" },
  { label: "Other", value: "OTHER" },
];

const PAYSTACK_COUNTRIES = ["NG", "GH", "KE", "ZA"];

export default function OnboardingPage() {
  const router = useRouter();
  const { organization } = useOrganization();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<OnboardingValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      name: organization?.name || "",
      billingCountry: "",
    },
  });

  const onSubmit = async (data: OnboardingValues) => {
    if (!organization?.id) {
      toast({
        title: "No Organization Found",
        description: "Please create or select an organization in Clerk first.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const slug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

      const paymentProvider = PAYSTACK_COUNTRIES.includes(data.billingCountry)
        ? "paystack"
        : "stripe";

      const { error } = await supabase.from("agencies").insert({
        clerk_org_id: organization.id,
        name: data.name,
        slug,
        billing_country: data.billingCountry,
        payment_provider: paymentProvider,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Your agency has been set up!",
      });

      router.push("/reports/new?onboarding=true");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Error",
        description: error.message || "Failed to save agency settings.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-surface p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Welcome to Proplo</CardTitle>
          <CardDescription>
            Let's get your boutique agency set up.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <Input
              label="Agency Name"
              placeholder="e.g. Design Studio Co"
              {...register("name")}
              error={errors.name?.message}
            />

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-medium text-mid uppercase tracking-wider">
                Billing Country
              </label>
              <select
                {...register("billingCountry")}
                className="flex h-10 w-full rounded-none border border-border bg-white px-3 py-2 text-sm text-dark focus:outline-none focus:border-brand transition-colors"
                defaultValue=""
              >
                <option value="" disabled>Select a country</option>
                {COUNTRIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {errors.billingCountry && (
                <span className="text-xs text-red-500">{errors.billingCountry.message}</span>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Setting up..." : "Complete Onboarding"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
