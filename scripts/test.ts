/**
 * Smoke test — verifies the environment is wired correctly after cloning.
 * Run with `pnpm test` (tsx loads .env via --env-file). Not a test suite; add one per project.
 */

async function main() {
  // 1. Database
  const { db } = await import("@/db");
  const { sql } = await import("drizzle-orm");
  await db.execute(sql`SELECT 1`);
  console.log("✓ database: SELECT 1 succeeded");

  // 2. Storage
  const { listFiles } = await import("@/lib/storage");
  await listFiles();
  console.log("✓ storage: listFiles succeeded");

  // 3. Stripe (optional)
  const { env } = await import("@/lib/env");
  if (env.STRIPE_SECRET_KEY) {
    console.log("✓ stripe: configured");
  } else {
    console.log("- stripe: not configured (optional)");
  }

  console.log("All checks passed.");
  process.exit(0);
}

main().catch((error) => {
  console.error("✗ smoke test failed:", error);
  process.exit(1);
});
