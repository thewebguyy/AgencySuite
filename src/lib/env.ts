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

type Env = z.infer<typeof envSchema>;

let _env: Env | undefined;

export function getEnv(): Env {
  // Return cached env if already validated
  if (_env) return _env;

  // During build phase or on the client, we might not have all env vars.
  // We want to avoid crashing the build.
  const isBuild = process.env.NODE_ENV === "production" && !process.env.VERCEL_ENV && !process.env.VERCEL;
  const isClient = typeof window !== "undefined";
  
  try {
    _env = envSchema.parse(process.env);
    return _env;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.issues.map((issue) => issue.path.join(".")).join(", ");
      const errorMessage = `❌ Invalid environment variables: ${missingVars}`;
      
      // If we are in the build phase or on the client, don't throw, just warn
      if (isBuild || isClient) {
        if (!isClient) {
          console.warn("\x1b[33m%s\x1b[0m", "⚠️  WARNING: Environment validation failed during build phase.");
          console.warn(`Missing: ${missingVars}`);
        }
        // Return a partial object or cast process.env to Env to allow execution to continue
        return process.env as unknown as Env;
      }

      console.error(JSON.stringify({
        level: "error",
        message: "ENVIRONMENT_VALIDATION_FAILED",
        missing: missingVars,
      }));
      throw new Error(errorMessage);
    } else {
      throw error;
    }
  }
}

// Still export the env object for compatibility, but it will be evaluated lazily if possible
// or just keep it as a legacy export that calls getEnv().
// However, since we want to avoid import-time crashes, we should probably 
// not export 'env' as a constant that calls getEnv() here.
// But some files might already import { env } from "@/lib/env".
// Let's use a Proxy for the legacy 'env' export to keep it lazy.

export const env = new Proxy({} as Env, {
  get(_, prop) {
    return getEnv()[prop as keyof Env];
  }
});
