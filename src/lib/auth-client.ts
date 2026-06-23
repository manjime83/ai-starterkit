import { stripeClient } from "@better-auth/stripe/client";
import { inferAdditionalFields, magicLinkClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), stripeClient({ subscription: true }), inferAdditionalFields<typeof auth>()],
});
