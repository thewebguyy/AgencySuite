/**
 * Pre-build Health Check
 * Verifies that the environment is correctly configured before starting the build.
 */

const requiredEnvVars = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "STRIPE_STARTER_PRICE_ID",
  "STRIPE_AGENCY_SUITE_PRICE_ID",
  "STRIPE_SCALE_PRICE_ID",
  "NEXT_PUBLIC_APP_URL",
];

console.log("🔍 Running Pre-build Health Check...");

const missing = [];

requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    missing.push(envVar);
  }
});

if (missing.length > 0) {
  console.warn("\x1b[33m%s\x1b[0m", "⚠️  WARNING: Missing Environment Variables:");
  missing.forEach((m) => console.warn(`   - ${m}`));
  console.warn("\x1b[33m%s\x1b[0m", "The build will continue, but the application might fail at runtime.");
} else {
  console.log("\x1b[32m%s\x1b[0m", "✅ All required environment variables are present.");
}

console.log("🚀 Health Check Complete. Proceeding to build...");
process.exit(0); // Never crash the build here as per requirements
