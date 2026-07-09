import { getSubscription } from "@/features/subscriptions/data";
import { auth } from "@/lib/auth";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { headers } from "next/headers";

export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  handleServerError: (e) => (e instanceof ActionError ? e.message : DEFAULT_SERVER_ERROR_MESSAGE),
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ActionError("Unauthorized");
  return next({ ctx: { user: session.user, session: session.session } });
});

export const proActionClient = authActionClient.use(async ({ next, ctx }) => {
  const subscription = await getSubscription(ctx.user.id);
  if (subscription?.status !== "active" && subscription?.status !== "trialing") {
    throw new ActionError("Pro subscription required");
  }
  return next({ ctx: { ...ctx, subscription } });
});
