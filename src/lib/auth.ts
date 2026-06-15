import { db } from "@/db";
import { subscriptions } from "@/db/schema";
import { MagicLinkEmail } from "@/emails/magic-link";
import { env } from "@/env";
import { sendEmail } from "@/lib/email";
import { getBaseUrl } from "@/lib/utils";
import { init } from "@paralleldrive/cuid2";
import { checkout, polar, portal, webhooks } from "@polar-sh/better-auth";
import { Polar } from "@polar-sh/sdk";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { eq } from "drizzle-orm";
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
              checkout({ successUrl: `${getBaseUrl()}/dashboard/settings?checkout=success` }),
              portal({ returnUrl: `${getBaseUrl()}/dashboard/settings` }),
              webhooks({
                secret: env.POLAR_WEBHOOK_SECRET ?? "",
                onSubscriptionCreated: async (payload) => {
                  await db.insert(subscriptions).values({
                    userId: payload.data.metadata?.userId as string,
                    polarSubscriptionId: payload.data.id,
                    status: payload.data.status,
                  });
                },
                onSubscriptionUpdated: async (payload) => {
                  await db
                    .update(subscriptions)
                    .set({ status: payload.data.status, updatedAt: new Date() })
                    .where(eq(subscriptions.polarSubscriptionId, payload.data.id));
                },
                onSubscriptionActive: async (payload) => {
                  await db
                    .update(subscriptions)
                    .set({ status: "active", canceledAt: null, updatedAt: new Date() })
                    .where(eq(subscriptions.polarSubscriptionId, payload.data.id));
                },
                onSubscriptionUncanceled: async (payload) => {
                  await db
                    .update(subscriptions)
                    .set({ status: "active", canceledAt: null, updatedAt: new Date() })
                    .where(eq(subscriptions.polarSubscriptionId, payload.data.id));
                },
                onSubscriptionCanceled: async (payload) => {
                  await db
                    .update(subscriptions)
                    .set({ status: "canceled", canceledAt: new Date(), updatedAt: new Date() })
                    .where(eq(subscriptions.polarSubscriptionId, payload.data.id));
                },
                onSubscriptionRevoked: async (payload) => {
                  await db
                    .update(subscriptions)
                    .set({ status: "revoked", updatedAt: new Date() })
                    .where(eq(subscriptions.polarSubscriptionId, payload.data.id));
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
