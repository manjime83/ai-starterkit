import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

// The @better-auth/stripe plugin owns the `subscriptions` table and keeps it in
// sync via its webhook handler. `referenceId` holds the user id (or org id).
export async function getSubscription(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.referenceId, userId),
  });
}

export async function isSubscribed(userId: string) {
  const subscription = await getSubscription(userId);
  return subscription?.status === "active" || subscription?.status === "trialing";
}
