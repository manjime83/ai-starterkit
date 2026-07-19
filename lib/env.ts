import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    // Required
    DATABASE_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.url(),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),

    // Email — Amazon SES
    EMAIL_FROM: z.email(),
    SES_REGION: z.string(),
    SES_ACCESS_KEY_ID: z.string(),
    SES_SECRET_ACCESS_KEY: z.string(),

    // Object storage — S3 or another S3-compatible bucket
    BUCKET_REGION: z.string(),
    BUCKET_ACCESS_KEY_ID: z.string(),
    BUCKET_SECRET_ACCESS_KEY: z.string(),
    BUCKET_NAME: z.string(),

    // Optional — non-AWS S3-compatible hosts only
    BUCKET_ENDPOINT: z.url().optional(),
    BUCKET_FORCE_PATH_STYLE: z.stringbool().default(false),

    // Optional — cron endpoint auth
    CRON_SECRET: z.string().min(32).optional(),

    // Optional — Stripe
    STRIPE_SECRET_KEY: z.string().optional(),
    STRIPE_WEBHOOK_SECRET: z.string().optional(),
    STRIPE_PRICE_ID: z.string().optional(),
  },
  client: {},
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET,
    BETTER_AUTH_URL: process.env.BETTER_AUTH_URL,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    EMAIL_FROM: process.env.EMAIL_FROM,
    SES_REGION: process.env.SES_REGION,
    SES_ACCESS_KEY_ID: process.env.SES_ACCESS_KEY_ID,
    SES_SECRET_ACCESS_KEY: process.env.SES_SECRET_ACCESS_KEY,
    BUCKET_REGION: process.env.BUCKET_REGION,
    BUCKET_ACCESS_KEY_ID: process.env.BUCKET_ACCESS_KEY_ID,
    BUCKET_SECRET_ACCESS_KEY: process.env.BUCKET_SECRET_ACCESS_KEY,
    BUCKET_NAME: process.env.BUCKET_NAME,
    BUCKET_ENDPOINT: process.env.BUCKET_ENDPOINT,
    BUCKET_FORCE_PATH_STYLE: process.env.BUCKET_FORCE_PATH_STYLE,
    CRON_SECRET: process.env.CRON_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET,
    STRIPE_PRICE_ID: process.env.STRIPE_PRICE_ID,
  },
  emptyStringAsUndefined: true,
});

if (typeof window === "undefined") {
  const stripeVariableCount = [env.STRIPE_SECRET_KEY, env.STRIPE_WEBHOOK_SECRET, env.STRIPE_PRICE_ID].filter(
    Boolean,
  ).length;

  if (stripeVariableCount !== 0 && stripeVariableCount !== 3) {
    throw new Error("STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, and STRIPE_PRICE_ID must be set together");
  }
}
