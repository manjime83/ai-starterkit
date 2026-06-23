import { db } from "@/db";
import { MagicLinkEmail } from "@/emails/magic-link";
import { env } from "@/env";
import { sendEmail } from "@/lib/email";
import { stripe } from "@better-auth/stripe";
import { init } from "@paralleldrive/cuid2";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import Stripe from "stripe";

const stripeClient = env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET ? new Stripe(env.STRIPE_SECRET_KEY) : null;

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
    ...(stripeClient
      ? [
          stripe({
            stripeClient,
            stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET ?? "",
            createCustomerOnSignUp: true,
            subscription: {
              enabled: true,
              plans: [{ name: "pro", priceId: env.STRIPE_PRICE_ID ?? "" }],
            },
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
