import { db } from "@/db";
import MagicLinkEmail from "@/emails/magic-link";
import { APP_NAME } from "@/lib/constants";
import { sendEmail } from "@/lib/email";
import { env } from "@/lib/env";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { stripe } from "@better-auth/stripe";
import { init } from "@paralleldrive/cuid2";
import { betterAuth } from "better-auth";
import { magicLink } from "better-auth/plugins";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache, createElement } from "react";
import Stripe from "stripe";

const stripePlugin =
  env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET && env.STRIPE_PRICE_ID
    ? stripe({
        stripeClient: new Stripe(env.STRIPE_SECRET_KEY),
        stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
        createCustomerOnSignUp: true,
        subscription: {
          enabled: true,
          plans: [{ name: "pro", priceId: env.STRIPE_PRICE_ID }],
        },
      })
    : null;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  advanced: {
    database: {
      generateId: ({ size }) => init({ length: size ?? 24 })(),
    },
  },
  rateLimit: {
    enabled: true,
    storage: "database", // survives restarts and holds across multiple instances
  },
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [
    magicLink({
      storeToken: "hashed",
      sendMagicLink: async ({ email, url }) => {
        await sendEmail({
          to: email,
          subject: `Sign in to ${APP_NAME}`,
          react: createElement(MagicLinkEmail, { url }),
        });
      },
    }),
    ...(stripePlugin ? [stripePlugin] : []),
  ],
});

// Called by the dashboard layout and every protected page; cache() dedupes to one DB hit per request.
export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return session;
});

export const stripeEnabled = Boolean(stripePlugin);

// Reads the webhook-synced `subscriptions` table for the signed-in user; the endpoint
// only returns `active`/`trialing` rows and only exists when the Stripe plugin is registered.
export const getSubscription = cache(async () => {
  if (!stripeEnabled) return undefined;
  const subscriptions = await auth.api.listActiveSubscriptions({ headers: await headers() });
  return subscriptions[0];
});
