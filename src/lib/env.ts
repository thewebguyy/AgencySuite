import { z } from "zod";

const envSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),

  // Clerk
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),

  // AI
  ANTHROPIC_API_KEY: z.string().min(1),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1),
  STRIPE_WEBHOOK_SECRET: z.string().min(1),
  STRIPE_STARTER_PRICE_ID: z.string().min(1),
  STRIPE_AGENCY_SUITE_PRICE_ID: z.string().min(1),
  STRIPE_SCALE_PRICE_ID: z.string().min(1),

  // App
  NEXT_PUBLIC_APP_URL: z.string().url(),

  // Paystack
  PAYSTACK_SECRET_KEY: z.string().min(1),

  // Resend
  RESEND_API_KEY: z.string().min(1),

  // Cron
  CRON_SECRET: z.string().min(1),

  // Upstash (Optional)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),

  // Node Environment
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

// For Next.js client-side safety, we only expose NEXT_PUBLIC vars in a separate schema if needed,
// but for the server-side, we want everything.

let env: z.infer<typeof envSchema>;

try {
  env = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const missingVars = error.issues.map((issue) => issue.path.join(".")).join(", ");
    const errorMessage = `❌ Invalid environment variables: ${missingVars}`;
    
    if (process.env.NODE_ENV === "production") {
      console.error(JSON.stringify({
        level: "error",
        message: "ENVIRONMENT_VALIDATION_FAILED",
        missing: missingVars,
      }));
      // In production, we might want to continue if some are optional, 
      // but essential ones should probably still fail if the app can't function.
      // For now, let's keep it strict.
      throw new Error(errorMessage);
    } else {
      throw new Error(errorMessage);
    }
  } else {
    throw error;
  }
}

export { env };
