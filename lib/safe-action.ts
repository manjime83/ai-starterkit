import { auth, getSubscription } from "@/lib/auth";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";
import { headers } from "next/headers";

export class ActionError extends Error {}

export const actionClient = createSafeActionClient({
  handleServerError: (e) => {
    if (e instanceof ActionError) return e.message;
    console.error(e); // unexpected: log the real error before masking it
    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new ActionError("Unauthorized");
  return next({ ctx: { user: session.user, session: session.session } });
});

export const proActionClient = authActionClient.use(async ({ next, ctx }) => {
  // getSubscription only ever returns an active/trialing subscription.
  const subscription = await getSubscription();
  if (!subscription) throw new ActionError("Pro subscription required");
  return next({ ctx: { ...ctx, subscription } });
});
