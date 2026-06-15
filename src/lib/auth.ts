import { db } from "@/db";
import { MagicLinkEmail } from "@/emails/magic-link";
import { env } from "@/env";
import { upsertSubscription } from "@/features/subscriptions";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils";
import { init } from "@paralleldrive/cuid2";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";

const polarClient = env.POLAR_ACCESS_TOKEN ? new Polar({ accessToken: env.POLAR_ACCESS_TOKEN }) : null;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  advanced: {
    database: {
      generateId: ({ size }: { size?: number }) => init({ length: size ?? 24 })(),
    },
  },
  socialProviders: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }: { email: string; url: string }) => {
        await sendEmail({
          to: email,
          subject: `Sign in to your account`,
          react: MagicLinkEmail({ url }),
        });
      },
    }),
    ...(polarClient
      ? [
          polar({
            client: polarClient,
            createCustomerOnSignUp: true,
            use: [
              checkout({
                products: [{ productId: env.POLAR_PRODUCT_ID ?? "", slug: "pro" }],
                successUrl: `${getBaseUrl()}/dashboard/settings?checkout=success`,
              }),
              portal({ returnUrl: `${getBaseUrl()}/dashboard/settings` }),
              webhooks({
                secret: env.POLAR_WEBHOOK_SECRET ?? "",
                onPayload: async (payload) => {
                  switch (payload.type) {
                    case "subscription.created":
                    case "subscription.updated":
                    case "subscription.active":
                    case "subscription.canceled":
                    case "subscription.uncanceled":
                    case "subscription.revoked":
                      break;
                    default:
                      return;
                  }

                  const subscription = payload.data;
                  const userId = subscription.customer.externalId;
                  if (!userId) return;

                  await upsertSubscription({
                    userId,
                    polarCustomerId: subscription.customerId,
                    polarSubscriptionId: subscription.id,
                    polarProductId: subscription.productId,
                    status: subscription.status,
                    periodStart: subscription.currentPeriodStart,
                    periodEnd: subscription.currentPeriodEnd,
                    cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                    cancelAt: subscription.cancelAtPeriodEnd ? subscription.currentPeriodEnd : null,
                    canceledAt: subscription.canceledAt,
                    endedAt: subscription.endedAt,
                    seats: subscription.seats,
                    trialStart: subscription.trialStart,
                    trialEnd: subscription.trialEnd,
                  });
                },
              }),
            ],
          }),
        ]
      : []),
  ],
});

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return session;
});
