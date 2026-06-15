import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { eq, type InferInsertModel } from "drizzle-orm";

type SubscriptionValues = Omit<InferInsertModel<typeof subscriptions>, "id" | "createdAt" | "updatedAt">;

export async function getSubscription(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
}

export async function isSubscribed(userId: string) {
  const subscription = await getSubscription(userId);
  return subscription?.status === "active";
}

export async function upsertSubscription(values: SubscriptionValues) {
  await db
    .insert(subscriptions)
    .values(values)
    .onConflictDoUpdate({
      target: subscriptions.polarSubscriptionId,
      set: { ...values, updatedAt: new Date() },
    });
}
