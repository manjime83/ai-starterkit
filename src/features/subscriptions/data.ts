import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// The @better-auth/stripe plugin owns the `subscriptions` table and keeps it in
// sync via its webhook handler. `referenceId` holds the user id (or org id).
// The template enforces one subscription per user, but if duplicate rows ever
// appear (e.g. a canceled one alongside an active one), prefer the live one.
export async function getSubscription(userId: string) {
  const rows = await db.query.subscriptions.findMany({
    where: eq(subscriptions.referenceId, userId),
  });
  return rows.find((row) => row.status === "active" || row.status === "trialing") ?? rows[0];
}

export async function isSubscribed(userId: string) {
  const subscription = await getSubscription(userId);
  return subscription?.status === "active" || subscription?.status === "trialing";
}
