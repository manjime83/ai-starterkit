import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSubscription(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
}

export async function isSubscribed(userId: string) {
  const subscription = await getSubscription(userId);
  return subscription?.status === "active";
}
