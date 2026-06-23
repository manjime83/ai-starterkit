import { db } from "@/db";
import { env } from "@/env";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`SELECT 1`);
  console.log("✓ Database");

  if (env.AWS_S3_BUCKET_NAME) {
    const { listFiles } = await import("@/lib/storage");
    await listFiles();
    console.log("✓ Storage");
  }

  if (env.STRIPE_SECRET_KEY) {
    console.log("✓ Stripe (secret key present)");
  }

  console.log("\nAll checks passed.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
