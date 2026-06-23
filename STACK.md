# AI Starter Kit — Stack Setup Guide

> Hand this file to any AI assistant to recreate this stack from scratch.

## Stack Overview

| Layer           | Tool                                              | Version |
| --------------- | ------------------------------------------------- | ------- |
| Framework       | Next.js 16 (App Router, standalone output)        | 16      |
| UI              | shadcn v4 (`@base-ui/react`) + Tailwind CSS v4    | latest  |
| Database ORM    | Drizzle ORM + postgres.js                         | latest  |
| Auth            | better-auth + Stripe plugin                       | latest  |
| Server Actions  | next-safe-action v8 + Zod v4                      | latest  |
| Forms           | react-hook-form + @hookform/resolvers v5          | latest  |
| ID generation   | @paralleldrive/cuid2                              | latest  |
| Env validation  | @t3-oss/env-nextjs                                | latest  |
| Email           | nodemailer + react-email v6 (unified package)     | latest  |
| Object storage  | Railway Buckets + AWS SDK v3 (optional)           | latest  |
| Formatting      | Prettier (organize-imports + tailwindcss plugins) | latest  |
| Linting         | ESLint v9 flat config + drizzle recommended       | latest  |
| TypeScript base | @tsconfig/strictest + @tsconfig/next              | latest  |
| Script runner   | tsx                                               | latest  |
| Dev concurrency | concurrently                                      | latest  |
| Deployment      | Railway (Railpack + Postgres + Bucket)            | —       |

---

## Step 1 — Create Next.js App

```bash
pnpx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --yes
```

## Step 2 — Install Production Dependencies

```bash
pnpm add \
  drizzle-orm postgres zod \
  next-safe-action react-hook-form @hookform/resolvers \
  better-auth @better-auth/stripe stripe \
  @t3-oss/env-nextjs \
  @paralleldrive/cuid2 \
  next-themes \
  nodemailer react-email \
  @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Step 3 — Install Dev Dependencies

```bash
pnpm add -D \
  drizzle-kit tsx concurrently \
  prettier prettier-plugin-organize-imports prettier-plugin-tailwindcss \
  eslint-plugin-drizzle \
  @tsconfig/strictest @tsconfig/next \
  @types/nodemailer
```

## Step 4 — Initialize shadcn

```bash
pnpx shadcn@latest init -d
pnpx shadcn@latest add button input label card textarea checkbox dialog table badge
pnpx shadcn@latest add sidebar separator avatar tooltip sonner
```

> shadcn v4 uses `@base-ui/react`. **No `asChild` prop.**
> Use `render={<Link href="..." />}` on `SidebarMenuButton` and `buttonVariants()` + `<Link>` for nav links.
> `SidebarMenuButton` accepts `render` (base-ui pattern), `isActive`, and `tooltip` props.
> Wrap the root layout with `<ThemeProvider>`, `<TooltipProvider>`, and `<Toaster />` (sonner).

## Step 5 — tsconfig.json

```json
{
  "extends": ["@tsconfig/strictest/tsconfig.json", "@tsconfig/next/tsconfig.json"],
  "compilerOptions": {
    "target": "esnext",
    "jsx": "react-jsx",
    "noPropertyAccessFromIndexSignature": false,
    "exactOptionalPropertyTypes": false,
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules", ".next"]
}
```

## Step 6 — prettier.config.mjs

```js
/** @type {import("prettier").Config} */
const config = {
  printWidth: 120,
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-tailwindcss"],
};
export default config;
```

> `prettier-plugin-organize-imports` handles import sorting in Prettier.
> Do NOT add `eslint-plugin-prettier` — it conflicts with the VSCode Prettier extension.
> Do NOT add `eslint-plugin-simple-import-sort` — Prettier handles it.

## Step 7 — eslint.config.mjs

```js
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import drizzle from "eslint-plugin-drizzle";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { drizzle },
    rules: { ...drizzle.configs.recommended.rules },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

> Do **not** add `eslint-plugin-tailwindcss` — it requires `tailwind.config.js` which doesn't exist in Tailwind v4.

## Step 8 — `src/app/api/health/route.ts`

Returns 200 with `{ status: "ok" }` when healthy, 503 when the DB is unreachable.

```ts
import { db } from "@/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
```

> Referenced by `railway.json` as the `healthcheckPath`. A failed DB connection prevents a bad deploy from going live.

## Step 9 — next.config.ts

```ts
import type { NextConfig } from "next";
const nextConfig: NextConfig = { output: "standalone" };
export default nextConfig;
```

## Step 10 — Environment Variables

```env
DATABASE_URL=""
BETTER_AUTH_SECRET="change-me-to-a-random-32-char-secret-string"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EMAIL_FROM="noreply@example.com"
EMAIL_SERVER_HOST="localhost"
EMAIL_SERVER_PORT="1025"
EMAIL_SERVER_USER=""
EMAIL_SERVER_PASSWORD=""

# Optional — Stripe billing. Leave blank to disable the billing layer entirely.
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID=""

# Optional — object storage (Railway Bucket). Leave blank if the project doesn't need file uploads.
AWS_ENDPOINT_URL="https://storage.railway.app"
AWS_S3_BUCKET_NAME=""
AWS_DEFAULT_REGION="auto"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
```

> Railway automatically provides the Bucket values when you auto-inject its credentials into the app service.
> Local email preview: `brew install mailpit && mailpit`
> For local development, use `railway run sh -c 'BETTER_AUTH_URL=http://localhost:3000 pnpm dev'` so Railway injects
> Postgres and Bucket variables while auth callbacks target localhost.

## Step 11 — src/env.ts (t3-env)

Validate all env vars with Zod v4. Use `z.url()` and `z.email()` directly (not `z.string().url()` — deprecated in Zod v4).

Mark Stripe and AWS vars as optional — they are runtime-guarded and their absence disables the feature:

```ts
// Required
DATABASE_URL: z.url(),
BETTER_AUTH_SECRET: z.string().min(32),
BETTER_AUTH_URL: z.url(),
GOOGLE_CLIENT_ID: z.string(),
GOOGLE_CLIENT_SECRET: z.string(),
EMAIL_FROM: z.email(),
EMAIL_SERVER_HOST: z.string(),
EMAIL_SERVER_PORT: z.string(),
EMAIL_SERVER_USER: z.string().optional(),
EMAIL_SERVER_PASSWORD: z.string().optional(),

// Optional — Stripe
STRIPE_SECRET_KEY: z.string().optional(),
STRIPE_WEBHOOK_SECRET: z.string().optional(),
STRIPE_PRICE_ID: z.string().optional(),

// Optional — object storage
AWS_ENDPOINT_URL: z.url().optional(),
AWS_S3_BUCKET_NAME: z.string().optional(),
AWS_DEFAULT_REGION: z.string().optional(),
AWS_ACCESS_KEY_ID: z.string().optional(),
AWS_SECRET_ACCESS_KEY: z.string().optional(),
```

## Step 12 — `src/lib/constants.ts`

Compile-time project constants. The first file to edit after cloning.

```ts
export const APP_NAME = "Your App";
```

> Used in: magic link email subject/header, home page `<h1>`, browser tab title (`metadata.title` in root layout), sidebar header.
> Do not put runtime config here — that belongs in `src/env.ts`.

## Step 13 — Project Structure (Feature-Sliced Design)

New features live in `src/features/`, keeping business logic out of the Next.js `app/` router segments:

```
src/
  features/          ← one folder per product feature
    todos/           ← DEMO ONLY — delete after internalizing the pattern
      ui/            ← React components for this feature
      actions/       ← server actions (one file per action)
      data/          ← Drizzle queries
      schemas.ts     ← shared Zod schemas (used by both actions and forms)
      index.ts       ← barrel export (ui + data + schemas)
    subscriptions/   ← subscription gating (always present when Stripe is enabled)
      data/          ← getSubscription + isSubscribed queries
      index.ts
  components/ui/     ← shadcn components
  db/                ← Drizzle schema, client, seed
  emails/            ← react-email templates
  lib/               ← auth (+ verifySession), auth-client, constants, email, storage, safe-action, utils
  scripts/           ← smoke test (test.ts)
  env.ts             ← t3-env validation
  app/               ← Next.js App Router (routing only — no business logic)
    api/
      auth/          ← better-auth catch-all route
      health/        ← GET → 200 ok / 503 error
    dashboard/       ← protected shell (layout renders sidebar, pages call verifySession)
      layout.tsx     ← renders AppSidebar + SidebarInset (no auth check — pages handle it)
      page.tsx       ← welcome card + subscription status card
      todos/         ← todos feature page (demo — delete when done)
      settings/      ← account info + billing (plan badge + Stripe checkout/portal)
    sign-in/         ← Google OAuth button + magic link email input
    page.tsx         ← minimal home page: APP_NAME h1, tagline, session-aware CTA button
```

**Rules:**

- `features/` may import from `lib/`, `db/`, `components/ui/` — but never from other features.
- `app/` route segments import from `features/` and `lib/auth` for session checks.
- Adding a feature: create `src/features/<name>/` with `ui/`, `actions/`, `data/`, `schemas.ts`, `index.ts`.
- `schemas.ts` defines Zod schemas shared between the action input validation and the react-hook-form `resolver`. Define once, use in both.
- Add a nav entry in `src/components/app-sidebar.tsx` `navItems` array to expose the feature in the sidebar.

## Step 12 — Drizzle Schema

Split into two files:

**`src/db/schema/auth.ts`** — better-auth tables (run `pnpm auth:generate` to regenerate):

- Use **plural** table names: `users`, `sessions`, `accounts`, `verifications`
- This is required by `usePlural: true` in the drizzle adapter
- The `@better-auth/stripe` plugin owns the `subscriptions` table and adds a `stripeCustomerId` column to `users`. Both live here (the plugin's schema is part of better-auth's generated output).

**`src/db/schema/app.ts`** — application tables (todos):

- Use `@paralleldrive/cuid2` for IDs: `.$defaultFn(() => createId())`

Todos table (demo — delete when done):

```ts
export const todos = pgTable("todos", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  completed: boolean("completed").notNull().default(false),
  attachmentKey: text("attachment_key"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

Subscriptions table (managed by `@better-auth/stripe` — **do not hand-edit**, regenerate with `pnpm auth:generate`). The plugin keeps it in sync from Stripe webhooks. `referenceId` holds the user id (or org id):

```ts
export const subscriptions = pgTable(
  "subscriptions",
  {
    id: text("id").primaryKey(),
    plan: text("plan").notNull(),
    referenceId: text("reference_id").notNull(),
    stripeCustomerId: text("stripe_customer_id"),
    stripeSubscriptionId: text("stripe_subscription_id"),
    status: text("status").notNull().default("incomplete"), // active | trialing | canceled | incomplete | ...
    periodStart: timestamp("period_start"),
    periodEnd: timestamp("period_end"),
    trialStart: timestamp("trial_start"),
    trialEnd: timestamp("trial_end"),
    cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
    cancelAt: timestamp("cancel_at"),
    canceledAt: timestamp("canceled_at"),
    endedAt: timestamp("ended_at"),
    seats: integer("seats"),
    billingInterval: text("billing_interval"),
    stripeScheduleId: text("stripe_schedule_id"),
  },
  (table) => [index("subscriptions_referenceId_idx").on(table.referenceId)],
);
```

**`src/db/schema/index.ts`** — re-exports both

## Step 13 — drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";
export default defineConfig({
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

> Use `process.env` directly — `@/*` aliases don't resolve in drizzle.config.ts.

## Step 14 — `src/app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

> All auth routes — Google OAuth callbacks, magic link verification, Stripe webhooks (`/api/auth/stripe/webhook`) — go through this single catch-all.

## Step 15 — better-auth (`src/lib/auth.ts`)

Auth methods: **Google OAuth** (social) + **magic link** (passwordless). Email+password is not included.

Key configuration:

```ts
import { init } from "@paralleldrive/cuid2";
import { stripe } from "@better-auth/stripe";
import { magicLink } from "better-auth/plugins";
import Stripe from "stripe";

const stripeClient = env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
  advanced: {
    database: {
      generateId: ({ size }) => init({ length: size ?? 24 })(),
    },
  },
  socialProviders: {
    google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        /* send email */
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
```

> The plugin handles checkout, the Stripe billing portal, **and** webhook persistence to the `subscriptions` table for you — no manual webhook handler. It mounts its own webhook endpoint at `/api/auth/stripe/webhook` (under the better-auth catch-all).
> `createCustomerOnSignUp: true` creates a Stripe customer on every new sign-up and stores its id on `users.stripeCustomerId`.
> Add a plan to the `plans` array for each Stripe Price you sell. `name` ("pro") is what the client passes to `subscription.upgrade({ plan })`.

Also export `verifySession` from `src/lib/auth.ts` for use in dashboard pages:

```ts
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const verifySession = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/sign-in");
  return session;
});
```

> `cache()` deduplicates the session call within a single render — multiple pages/components can call `verifySession()` with only one DB hit.
> The dashboard layout does **not** call `verifySession`. Each protected page calls it directly.

> The plugin's webhook updates `status` to `active`, `trialing`, `canceled`, etc. — query it via `getSubscription` / `isSubscribed` (see Step 14g).
> Checkout success redirects to the `successUrl` passed to `subscription.upgrade` (`/dashboard/settings?checkout=success`).

## Step 16b — `src/lib/auth-client.ts`

Client-side auth client. Always includes the Stripe plugin (costs nothing when Stripe is unconfigured). `subscription: true` exposes `authClient.subscription.*` (upgrade, cancel, restore, list, billingPortal).

```ts
import { createAuthClient } from "better-auth/react";
import { magicLinkClient, inferAdditionalFields } from "better-auth/client/plugins";
import { stripeClient } from "@better-auth/stripe/client";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  plugins: [magicLinkClient(), stripeClient({ subscription: true }), inferAdditionalFields<typeof auth>()],
});
```

> `inferAdditionalFields<typeof auth>()` syncs server-side session field types to the client.

## Step 15b — DB client (`src/db/index.ts`)

Singleton pattern to prevent connection pool exhaustion during Next.js dev hot reloads:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/env";

const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> };

export const db = globalForDb.db ?? drizzle(postgres(env.DATABASE_URL), { schema });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
```

> In production, module code runs once — the guard is a no-op. In dev, hot reloads reuse the existing client.
> Always `db:generate` + `db:migrate` — never `db:push` in normal workflow. `db:push` is reserved for emergency schema fixes only.

## Step 15c — Stripe product setup

1. Go to your [Stripe dashboard](https://dashboard.stripe.com) → Product catalog → add a product with a recurring price.
2. Copy the **Price ID** (e.g. `price_xxxxxxxxxxxxxxxx`) — not the product id.
3. Paste it into `STRIPE_PRICE_ID` in `.env.local`, and set `STRIPE_SECRET_KEY` (from Developers → API keys).
4. Get `STRIPE_WEBHOOK_SECRET` from the webhook endpoint (`pnpm stripe:dev` prints it locally, or create an endpoint in the dashboard pointing at `<BETTER_AUTH_URL>/api/auth/stripe/webhook`).

That's it. An **Upgrade to Pro** button appears in the dashboard automatically when signed in and `STRIPE_PRICE_ID` is set. It calls `authClient.subscription.upgrade({ plan })` and redirects to Stripe Checkout.

**Checkout flow wired in `src/components/checkout-button.tsx`:**

```ts
await authClient.subscription.upgrade({
  plan: "pro", // matches the plan name in auth.ts
  successUrl: "/dashboard/settings?checkout=success",
  cancelUrl: "/dashboard/settings",
});
```

**Manage / cancel** is wired in `src/components/manage-subscription-button.tsx` via the Stripe billing portal:

```ts
await authClient.subscription.billingPortal({ returnUrl: "/dashboard/settings" });
```

**Webhooks** are handled entirely by the plugin (`/api/auth/stripe/webhook`) — it upserts the `subscriptions` table on every `customer.subscription.*` event and resolves the user via `stripeCustomerId`. No manual handler to write.

> Local webhook testing: `pnpm stripe:dev` (Stripe CLI `stripe listen`) forwards events to `/api/auth/stripe/webhook` and prints the signing secret to put in `STRIPE_WEBHOOK_SECRET`.

## Step 14b — Root layout (`src/app/layout.tsx`)

```tsx
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME } from "@/lib/constants";

export const metadata = { title: APP_NAME };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            {children}
            <Toaster />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

> `suppressHydrationWarning` on `<html>` silences next-themes hydration mismatch.
> `<Toaster />` must be inside `<ThemeProvider>` — it uses `useTheme` from Sonner.

## Step 14c — Dashboard layout (`src/app/dashboard/layout.tsx`)

```tsx
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { verifySession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await verifySession();

  return (
    <SidebarProvider>
      <AppSidebar user={session.user} />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  );
}
```

> The layout calls `verifySession()` only for the sidebar user info — not as the auth guard.
> Each protected page also calls `verifySession()` as its own guard. React `cache()` deduplicates the DB hit.

## Step 14d — App sidebar (`src/components/app-sidebar.tsx`)

Default `navItems`:

```ts
const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Todos", href: "/dashboard/todos", icon: CheckSquare }, // demo — delete when done
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];
```

The sidebar footer contains the **theme toggle** (light → dark → system cycle) and the user avatar/name.

> Default theme: **system** (matches OS preference). Toggle in sidebar footer — no toggle on the settings page.

## Step 14d — Dashboard overview page (`src/app/dashboard/page.tsx`)

Shows two cards only:

1. **Welcome card** — user's name and email (from session)
2. **Subscription card** — "Free" or "Pro" status badge + "Upgrade to Pro" button (calls `authClient.subscription.upgrade`) when not subscribed; "Manage subscription" billing-portal link when subscribed

No placeholder stats, no fake charts. Both pieces of data are real and immediately useful.

## Step 14e — Sign-in page

The sign-in page (`src/app/sign-in/page.tsx`) supports **two methods only**:

- **Google OAuth** — "Continue with Google" button calls `signIn.social({ provider: "google", callbackURL: "/dashboard" })`
- **Magic link** — email input calls `authClient.signIn.magicLink({ email, callbackURL: "/dashboard" })`, user receives a link via email

Email+password is **not** included. Do not add it.

Google OAuth requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in env. Configure the OAuth client in [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client IDs. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

## Step 14f — Todos feature (demo scaffolding)

**Delete `src/features/todos/` and `src/app/dashboard/todos/` once you've internalized the FSD pattern.**

The todos feature demonstrates the complete FSD slice including optional S3 attachment upload:

**`src/features/todos/schemas.ts`** — shared between actions and forms:

```ts
import { z } from "zod";

export const createTodoSchema = z.object({
  text: z.string().min(1).max(500),
  attachmentKey: z.string().optional(),
});

export const toggleTodoSchema = z.object({
  id: z.string(),
});
```

**Actions (`src/features/todos/actions/`)** — each imports from `schemas.ts`:

- `create-todo.ts` — `authActionClient`, input: `createTodoSchema`, inserts to DB
- `toggle-todo.ts` — `authActionClient`, input: `toggleTodoSchema`, flips `completed` for a todo owned by the current user
- `get-upload-url.ts` — `authActionClient`, calls `getPresignedUploadUrl()` from `src/lib/storage.ts`, returns a presigned S3 URL for the client to upload directly. Only available when storage is configured.

**Upload flow (two steps):**

1. Client calls `getUploadUrl` action → receives presigned URL + S3 key
2. Client uploads file directly to S3 via `fetch(presignedUrl, { method: "PUT", body: file })`
3. Client calls `createTodo` action with the resulting S3 key as `attachmentKey`

**UI (`src/features/todos/ui/`):**

- `todo-form.tsx` — react-hook-form form with text input + optional file input. Validation errors show inline; server errors show as Sonner toast.
- `todo-list.tsx` — Server Component that fetches todos and renders each item with a toggle checkbox and attachment link (presigned download URL via `getPresignedDownloadUrl()`).

## Step 14g — Subscription gating (freemium)

The template assumes a freemium model: users access the app for free and optionally upgrade to Pro.

**`src/features/subscriptions/data/index.ts`** — query subscription status:

```ts
// The Stripe plugin keeps `subscriptions` in sync; `referenceId` holds the user id.
export async function getSubscription(userId: string) {
  return db.query.subscriptions.findFirst({
    where: eq(subscriptions.referenceId, userId),
  });
}

export async function isSubscribed(userId: string) {
  const subscription = await getSubscription(userId);
  return subscription?.status === "active" || subscription?.status === "trialing";
}
```

**`src/lib/safe-action.ts`** — extend `authActionClient` with a Pro gate:

```ts
export const actionClient = createSafeActionClient();

export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw new Error("Unauthorized");
  return next({ ctx: { user: session.user, session: session.session } });
});

export const proActionClient = authActionClient.use(async ({ next, ctx }) => {
  const subscription = await getSubscription(ctx.user.id);
  if (subscription?.status !== "active" && subscription?.status !== "trialing") {
    throw new Error("Pro subscription required");
  }
  return next({ ctx: { ...ctx, subscription } });
});
```

Use `authActionClient` for actions available to all signed-in users. Use `proActionClient` for Pro-only actions.

For gating UI in Server Components, call `isSubscribed(session.user.id)` directly.

## Step 15 — getBaseUrl utility

```ts
export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
```

> `BETTER_AUTH_URL` is already required and contains the full URL with protocol — no platform-specific env var needed.

## Step 16 — Email (`src/lib/email.ts`)

> react-email v6 ships as a single unified package. Do **not** install `@react-email/components` or `@react-email/render` — they are deprecated. Everything comes from `"react-email"`.

```ts
import { render } from "react-email";
import nodemailer from "nodemailer";
// configure transporter from EMAIL_SERVER_* env vars
// render(React element) → HTML string → send via transporter
// render() is async in v6 — always await it
```

Email templates live in `src/emails/` as React components.

**`src/emails/magic-link.tsx`** — minimal but complete:

```tsx
import { APP_NAME } from "@/lib/constants";
import { Body, Button, Container, Head, Heading, Html, Preview, Section, Text } from "react-email";

export function MagicLinkEmail({ url }: { url: string }) {
  return (
    <Html>
      <Head />
      <Preview>Sign in to {APP_NAME}</Preview>
      <Body>
        <Container>
          <Heading>Sign in to {APP_NAME}</Heading>
          <Section>
            <Text>Click the button below to sign in. This link expires in 10 minutes.</Text>
            <Button href={url}>Sign in</Button>
            <Text>Or copy this link: {url}</Text>
            <Text>If you didn't request this, you can safely ignore this email.</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}
```

Preview with `pnpm email:dev` (react-email dev server).

> Supports any SMTP provider (AWS SES, Mailgun, Postmark, etc.) via the generic `EMAIL_SERVER_*` env vars.
> Local email preview: `brew install mailpit && mailpit`

## Step 17 — Railway Bucket / Object Storage (`src/lib/storage.ts`)

**Optional** — only initializes when `AWS_S3_BUCKET_NAME` is set. Projects that don't need file uploads leave the AWS vars blank and the client is `null`.

Uses `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` with a private, S3-compatible Railway Bucket.

```ts
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = env.AWS_S3_BUCKET_NAME
  ? new S3Client({
      endpoint: env.AWS_ENDPOINT_URL,
      region: env.AWS_DEFAULT_REGION,
      credentials: { accessKeyId: env.AWS_ACCESS_KEY_ID!, secretAccessKey: env.AWS_SECRET_ACCESS_KEY! },
    })
  : null;

function requireS3(): S3Client {
  if (!s3) throw new Error("Storage not configured — set AWS_S3_BUCKET_NAME to enable");
  return s3;
}

// Functions: uploadFile, downloadFile, deleteFile, listFiles
//            getPresignedUploadUrl, getPresignedDownloadUrl
// All call requireS3() internally.
```

Railway injects these Bucket variables: `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`, `AWS_DEFAULT_REGION`,
`AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY`.
Railway Buckets are private, so serve files through presigned URLs or an authenticated backend route.

## Step 18 — next-safe-action + react-hook-form

See Step 14g for the full `safe-action.ts` setup including `authActionClient` and `proActionClient`.

**Error handling convention (apply everywhere):**

- **Validation errors** (`result.validationErrors`) — field-level, from Zod. Show inline below the field via react-hook-form's `setError`. Never toast these.
- **Server errors** (`result.serverError`) — auth failures, DB errors, business logic. Show as a Sonner toast (`toast.error(...)`). Never show inline.

```ts
// In any useAction / useOptimisticAction onError callback:
onError: ({ error }) => {
  if (error.validationErrors) {
    for (const [field, messages] of Object.entries(error.validationErrors)) {
      form.setError(field as never, { message: messages?._errors?.[0] });
    }
  } else if (error.serverError) {
    toast.error(error.serverError);
  }
},
```

> next-safe-action v8 uses Standard Schema — Zod v4 works natively.
> `onSuccess` callback receives `{ data, input }` as a single object.

## Step 19 — package.json Scripts

```json
{
  "dev": "next dev",
  "dev:all": "concurrently --names \"next,studio\" \"pnpm dev\" \"pnpm db:studio\"",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "postlint": "tsc --noEmit",
  "format": "prettier --write .",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx src/db/seed.ts", // empty by default — add project-specific seed data per project
  "email:dev": "email dev src/emails",
  "stripe:dev": "stripe listen --forward-to localhost:3000/api/auth/stripe/webhook",
  "auth:generate": "better-auth generate --output src/db/schema/auth.ts -y",
  "test": "tsx src/scripts/test.ts" // smoke test: DB connectivity + optional service checks
}
```

> `postlint` runs `tsc --noEmit` automatically after every lint run.
> `stripe:dev`: forward Stripe events to the local app via the Stripe CLI (`stripe listen`). Requires `stripe login` once.
> Railpack handles the standalone build and container startup — no Railway-specific build/start scripts needed.

## Step 20 — Deployment on Railway

Uses **Railpack** for building. Railpack auto-detects Next.js standalone output and handles the static file copy and `HOSTNAME=0.0.0.0` startup automatically.

File: `railway.json` (minimal — Railpack handles the rest):

```json
{
  "deploy": {
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60,
    "preDeployCommand": "pnpm db:migrate"
  }
}
```

1. Create a Railway project and deploy this repository from GitHub or with `railway up`.
2. Add a PostgreSQL service and reference its `DATABASE_URL` from the app service.
3. Optionally add a Bucket and auto-inject its credentials into the app service.
4. Generate a public app domain, then set `BETTER_AUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`.
5. Configure Google OAuth with `<BETTER_AUTH_URL>/api/auth/callback/google`.

**Required app service variables:**

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_FROM=
EMAIL_SERVER_HOST=
EMAIL_SERVER_PORT=
EMAIL_SERVER_USER=
EMAIL_SERVER_PASSWORD=
```

**Optional app service variables (leave blank to disable the feature):**

```
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
AWS_ENDPOINT_URL=
AWS_S3_BUCKET_NAME=
AWS_DEFAULT_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

`DATABASE_URL` should reference the Railway Postgres service. The five Bucket variables should be auto-injected from
the Railway Bucket. For local development, link the project with the Railway CLI and run commands through
`railway run`, which injects the same service variables locally.

> Also compatible with **Dokploy** and any other platform that supports Railpack.

## Step 21 — Home page (`src/app/page.tsx`)

Minimal landing page with a session-aware CTA. Not a redirect — an actual shippable page.

```tsx
import { APP_NAME } from "@/lib/constants";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-4xl font-bold">{APP_NAME}</h1>
      <p className="text-muted-foreground">Build your SaaS faster.</p>
      <Link href={session ? "/dashboard" : "/sign-in"} className={buttonVariants({ size: "lg" })}>
        {session ? "Go to Dashboard" : "Get Started"}
      </Link>
    </main>
  );
}
```

> No nav bar, no features section, no footer. Replace the tagline per project.

## Step 21b — Settings page (`src/app/dashboard/settings/page.tsx`)

Two sections:

1. **Account** — user's name and email (read-only, from `verifySession()`)
2. **Billing** — current plan badge ("Free" or "Pro") + "Upgrade to Pro" checkout button (`authClient.subscription.upgrade`) when not subscribed, or "Manage subscription" Stripe billing portal link (`authClient.subscription.billingPortal()`) when subscribed

No password change (no password in this stack). No danger zone by default — add account deletion per project if needed.

## Step 22 — `src/scripts/test.ts` (smoke test)

Verifies the environment is wired correctly after cloning. Run with `pnpm test`.

```ts
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { env } from "@/env";

async function main() {
  // DB
  await db.execute(sql`SELECT 1`);
  console.log("✓ Database");

  // Storage (optional)
  if (env.AWS_S3_BUCKET_NAME) {
    const { listFiles } = await import("@/lib/storage");
    await listFiles();
    console.log("✓ Storage");
  }

  // Stripe (optional)
  if (env.STRIPE_SECRET_KEY) {
    // lightweight check — just confirm the secret key is present
    console.log("✓ Stripe (secret key present)");
  }

  console.log("\nAll checks passed.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

## Step 22 — Format All Code

Once all files are in place, run Prettier to normalize the entire codebase:

```bash
pnpm format
```

## Step 23 — Verify Linting

Run the full lint pipeline to confirm ESLint, TypeScript, and Prettier are all clean:

```bash
pnpm lint
```

This runs in sequence: `eslint` → `tsc --noEmit`. Use `pnpm format:check` to verify Prettier separately.

---

## Step 24 — `AGENTS.md`

`create-next-app` generates `AGENTS.md` at the repo root. Augment it with two additions only:

**1. Pointer to stack reference:**

```md
## Stack

See `STACK.md` for the full stack setup guide, conventions, and key gotchas.
```

**2. llms.txt — docs context for AI:**

| Tool                  | llms.txt URL                          |
| --------------------- | ------------------------------------- |
| **Next.js 16**        | https://nextjs.org/docs/llms.txt      |
| **Next.js 16 (full)** | https://nextjs.org/docs/llms-full.txt |
| **shadcn/ui**         | https://ui.shadcn.com/llms.txt        |
| **Drizzle ORM**       | https://orm.drizzle.team/llms.txt     |
| **better-auth**       | https://www.better-auth.com/llms.txt  |
| **Stripe**            | https://docs.stripe.com/llms.txt      |
| **next-safe-action**  | https://next-safe-action.dev/llms.txt |
| **Zod v4**            | https://zod.dev/llms.txt              |
| **react-email**       | https://react.email/docs/llms.txt     |

> Do not duplicate content from `STACK.md` here — point to it instead.

## Step 25 — AI Configuration (Skills)

Configure your AI coding assistant with first-party knowledge packs for every tool in this stack.

### Claude Code Skills

Install structured knowledge packs so the AI knows each library's conventions:

```bash
pnpm dlx skills add shadcn/ui
pnpx skills add better-auth/skills
pnpx skills add next-safe-action/skills
```

| Skill                | What it teaches                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **shadcn/ui**        | Component patterns, `buttonVariants`, theming, registry authoring. Auto-activates when `components.json` is present. |
| **better-auth**      | Library conventions, safe patterns, plugin setup (6 packs: best-practices, security, email/password, org, 2FA)       |
| **next-safe-action** | Client creation, middleware, hooks, forms, error handling, better-auth + TanStack Query integrations (9 packs)       |

> Skills are stored in your project and auto-discovered by Claude Code.
> After installing, restart Claude Code (or reload skills) to activate.

---

## Key Gotchas

1. **shadcn v4 + @base-ui/react** — No `asChild`. Use `buttonVariants()` + `<Link>`:

   ```tsx
   <Link href="/dashboard/todos" className={cn(buttonVariants())}>
     Go
   </Link>
   ```

2. **drizzle.config.ts** — Can't use `@/*` aliases. Use `process.env.DATABASE_URL!`.

3. **Zod v4** — `z.url()` and `z.email()` are top-level types. `z.string().url()` / `.email()` are deprecated.

4. **Zod v4 + next-safe-action v8** — Standard Schema built in, no adapter needed.

5. **next-safe-action v8 `onSuccess`** — single `{ data, input }` argument.

6. **better-auth + usePlural** — schema tables must use plural names (`users`, `sessions`...). Run `auth:generate` to regenerate.

7. **Auth methods** — only Google OAuth + magic link. Do **not** add `emailAndPassword: { enabled: true }` to the auth config.

8. **Stripe plugin** — guard with `env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET` so the plugin only mounts when configured. The plugin owns the `subscriptions` table, mounts its own webhook at `/api/auth/stripe/webhook`, and persists subscription state for you — do not write a manual webhook handler. `referenceId` (not `userId`) is the FK back to the user.

9. **Object storage** — optional, guarded by `env.AWS_S3_BUCKET_NAME`. The S3 client is `null` when the var is absent. All storage functions call `requireS3()` internally and throw a clear error if storage is not configured.

10. **Railway Buckets + S3Client** — use Railway's injected `AWS_ENDPOINT_URL`, `AWS_S3_BUCKET_NAME`,
    `AWS_DEFAULT_REGION`, `AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` variables. New Buckets use
    virtual-hosted-style URLs, so do not force path style.

11. **Tailwind v4** — config lives in `globals.css` via `@import "tailwindcss"`, not `tailwind.config.js`.

12. **Railway migrations** — use Railway's pre-deploy command (`pnpm db:migrate`), not `postbuild`, so a failed
    migration prevents the new deployment from replacing the healthy previous deployment.

13. **shadcn sidebar — base-ui `render` prop** — `SidebarMenuButton` uses base-ui's `useRender`, so pass `render={<Link href="..." />}` instead of `asChild`. Children render inside the link.

14. **Sonner + next-themes** — `<Toaster />` from `@/components/ui/sonner` uses `useTheme`. Wrap root layout with `<ThemeProvider attribute="class">` before `<TooltipProvider>`. Add `suppressHydrationWarning` to `<html>` to silence theme hydration mismatch.

15. **Todos feature** — demo scaffolding only. Delete `src/features/todos/` and `src/app/dashboard/todos/` once you've internalized the FSD pattern. Do not ship it.

16. **getBaseUrl** — reads `BETTER_AUTH_URL` on the server. No platform-specific env var needed. Always set `BETTER_AUTH_URL` in production.

17. **Railpack** — handles Next.js standalone build and container startup automatically. Do not add `build:railway` or `start:railway` scripts; the standard `pnpm build` and `pnpm start` are sufficient for local use.

18. **`verifySession`** — exported from `src/lib/auth.ts`, wrapped in React `cache()`. Called in both the dashboard layout (for sidebar user info) and each protected page (auth guard). Cache deduplicates — one DB hit per request regardless of how many times it's called.

19. **`src/lib/constants.ts`** — only `APP_NAME`. Do not add runtime values (those go in `src/env.ts`). First thing to update after cloning.

20. **Shared schemas** — define Zod schemas in `src/features/<name>/schemas.ts`. Import them in both the safe action (`input: schema`) and the form (`resolver: zodResolver(schema)`). Never duplicate schemas.

21. **Optimistic updates** — use `useOptimisticAction` for toggle (instant feedback) and `useAction` for create (multi-step upload flow). Do not use `useOptimisticAction` for actions with async side effects like file uploads.

22. **`db:push` is not part of the workflow** — always use `db:generate` + `db:migrate`. `db:push` exists for emergencies only, never for normal schema iteration.

23. **`next-themes`** — install explicitly (`pnpm add next-themes`). Do not rely on it being pulled in transitively by shadcn.

24. **Stripe client** — initialized in `src/lib/auth.ts` as `const stripeClient = env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET ? new Stripe(...) : null`. The `stripe` package must be in production deps. Subscription "active" checks include `trialing`, not just `active` (see `isSubscribed` / `proActionClient`).
