import { getSubscription } from "@/features/subscriptions/data";
import { auth } from "@/lib/auth";
import { createSafeActionClient } from "next-safe-action";
import { headers } from "next/headers";

export const actionClient = createSafeActionClient();

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return next({ ctx: { user: session.user, session: session.session } });
});

export const proActionClient = authActionClient.use(async ({ next, ctx }) => {
  const subscription = await getSubscription(ctx.user.id);
  if (subscription?.status !== "active") throw new Error("Pro subscription required");
  return next({ ctx: { ...ctx, subscription } });
});
