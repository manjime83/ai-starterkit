# AI Starter Kit — Stack Setup Guide

> Hand this file to any AI assistant to recreate this stack from scratch.

## Stack Overview

| Layer           | Tool                                                  |
| --------------- | ----------------------------------------------------- |
| Framework       | Next.js 16 (App Router)                               |
| UI              | shadcn v4 (`@base-ui/react`) + Tailwind CSS v4        |
| Icons           | lucide-react                                          |
| Theming         | next-themes (system default)                          |
| Database ORM    | Drizzle ORM + postgres.js                             |
| Auth            | better-auth + Stripe plugin                           |
| Server Actions  | next-safe-action v8 + Zod v4                          |
| Forms           | react-hook-form + @hookform/resolvers                 |
| ID generation   | @paralleldrive/cuid2                                  |
| Env validation  | @t3-oss/env-nextjs                                    |
| Email           | Amazon SES (`@aws-sdk/client-sesv2`) + react-email v6 |
| Object storage  | AWS S3 + AWS SDK v3                                   |
| Formatting      | Prettier (organize-imports + tailwindcss plugins)     |
| Linting         | ESLint v9 flat config + drizzle + prettier            |
| TypeScript base | @tsconfig/strictest + @tsconfig/next                  |
| Script runner   | tsx                                                   |
| Dev concurrency | concurrently                                          |
| Local services  | Docker Compose (Postgres + SeaweedFS S3)              |
| CI              | GitHub Actions (format check + lint)                  |
| Infrastructure  | Terraform (`terraform-aws-modules`)                   |
| DB backups      | Railway cron container (pg_dump → S3)                 |
| Deployment      | Railway (Railpack + Postgres)                         |

---

## Step 1 — Create Next.js App

```bash
pnpm dlx create-next-app@latest . --typescript --tailwind --eslint --app --no-src-dir --yes
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
  react-email \
  shadcn \
  @aws-sdk/client-sesv2 @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

> `shadcn` is the shadcn CLI installed as a project dependency — component adds run through the pinned
> `pnpm shadcn` binary instead of a floating `@latest`.

## Step 3 — Install Dev Dependencies

```bash
pnpm add -D \
  drizzle-kit tsx concurrently \
  prettier prettier-plugin-organize-imports prettier-plugin-tailwindcss \
  eslint-config-prettier eslint-plugin-prettier \
  eslint-plugin-drizzle \
  auth \
  @tsconfig/strictest @tsconfig/next
```

> `auth` is the Better Auth CLI package — it provides the `better-auth` binary used by the `auth:generate` script.

## Step 4 — Initialize shadcn

```bash
pnpm shadcn init -d
pnpm shadcn add button input label card textarea checkbox dialog table badge
pnpm shadcn add sidebar separator avatar tooltip sonner
```

> shadcn v4 uses `@base-ui/react` — there is **no `asChild` prop**. See Key Gotchas 1 and 13 for the
> `buttonVariants()` + `<Link>` and `render={...}` patterns.
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
    "paths": { "@/*": ["./*"] }
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

## Step 7 — eslint.config.mjs

```js
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import drizzle from "eslint-plugin-drizzle";
import prettierRecommended from "eslint-plugin-prettier/recommended";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: { drizzle },
    rules: { ...drizzle.configs.recommended.rules },
  },
  prettierRecommended,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
```

> `prettierRecommended` (from `eslint-plugin-prettier`) runs Prettier as a lint rule, so `pnpm lint` is a single
> gate covering lint + formatting + types (`postlint` runs `tsc --noEmit`). It must come **after** the other
> configs so `eslint-config-prettier` can disable conflicting stylistic rules.

## Step 8 — Environment Variables

Write this template to a committed `.env.example`, then `cp .env.example .env` and fill in real values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app" # compose.yaml default; override in production
BETTER_AUTH_SECRET="" # generate: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
EMAIL_FROM="" # must be a verified SES identity (address or domain)

# AWS — one key pair for SES (email) and S3 (storage)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""

# Optional — cron endpoint auth. Leave blank to disable /api/cron entirely. Generate like BETTER_AUTH_SECRET.
CRON_SECRET=""

# Optional — Stripe billing. Leave blank to disable the billing layer entirely.
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID=""

# S3 object storage — bucket name defaults to "uploads"; set BUCKET_NAME to override.
# The endpoint below targets local SeaweedFS (compose.yaml). Unset both for real AWS S3 in production.
BUCKET_ENDPOINT="http://localhost:8333"
BUCKET_FORCE_PATH_STYLE="true"
# BUCKET_NAME="uploads"
```

> Empty strings count as **unset** (see `emptyStringAsUndefined` in Step 9): the app refuses to boot until the
> required vars are filled in. Fill `DATABASE_URL`, `BETTER_AUTH_SECRET`, the Google OAuth pair, and the AWS
> credentials first.
> The AWS key pair is shared by SES (email) and S3 (storage) — one IAM user with `ses:SendEmail` plus scoped S3
> access to the project bucket.
> For local development, `docker compose up -d` (Step 10) provides Postgres and S3 — the defaults above already
> point at them.

## Step 9 — lib/env.ts (t3-env)

Validate all env vars with Zod v4. Use `z.url()` and `z.email()` directly (not `z.string().url()` — deprecated in Zod v4).

Mark the Stripe vars as optional — they are runtime-guarded and their absence disables billing. The AWS
credentials are **required** (SES needs them for magic-link email), and `BUCKET_NAME` defaults to `"uploads"`:

```ts
// Required
DATABASE_URL: z.url(),
BETTER_AUTH_SECRET: z.string().min(32),
BETTER_AUTH_URL: z.url(),
GOOGLE_CLIENT_ID: z.string(),
GOOGLE_CLIENT_SECRET: z.string(),
EMAIL_FROM: z.email(),

// AWS — shared by SES and S3 storage
AWS_REGION: z.string(),
AWS_ACCESS_KEY_ID: z.string(),
AWS_SECRET_ACCESS_KEY: z.string(),

// Optional — cron endpoint auth
CRON_SECRET: z.string().optional(),

// Optional — Stripe
STRIPE_SECRET_KEY: z.string().optional(),
STRIPE_WEBHOOK_SECRET: z.string().optional(),
STRIPE_PRICE_ID: z.string().optional(),

// Object storage
BUCKET_NAME: z.string().default("uploads"),
BUCKET_ENDPOINT: z.url().optional(),
BUCKET_FORCE_PATH_STYLE: z.stringbool().default(false),
```

And set `emptyStringAsUndefined` on the `createEnv` call:

```ts
export const env = createEnv({
  server: {
    /* schema above */
  },
  client: {},
  runtimeEnv: {
    /* list every var explicitly: DATABASE_URL: process.env.DATABASE_URL, ... */
  },
  emptyStringAsUndefined: true,
});
```

> `emptyStringAsUndefined: true` makes `VAR=""` count as unset: required vars fail fast at boot instead of
> booting with broken auth, and the optional Stripe/AWS guards (`env.STRIPE_SECRET_KEY && ...`) behave cleanly.

## Step 10 — compose.yaml (local development)

Two services for local development. Compose reads `./.env` automatically for `${VAR}` interpolation, and all
state lives under `./.data` (add `/.data` to `.gitignore`).

- **postgres** — `postgres:latest` on port 5432, data mounted at `./.data/postgres:/var/lib/postgresql`.
  Credentials interpolate with overridable defaults — `${POSTGRES_USER:-postgres}`,
  `${POSTGRES_PASSWORD:-postgres}`, `${POSTGRES_DB:-app}` — plus a `pg_isready` healthcheck.
- **s3** — SeaweedFS (`chrislusf/seaweedfs:latest`), a **single container**, S3 API on port 8333, data in
  `./.data/s3`. Its startup command first writes an S3 identity config to `/etc/s3.json` registering the
  **same AWS key pair from `.env`** (`${AWS_ACCESS_KEY_ID:?}` / `${AWS_SECRET_ACCESS_KEY:?}`, all actions:
  Admin/Read/Write/List/Tagging), then
  `exec weed server -dir=/data -ip.bind=0.0.0.0 -s3 -s3.port=8333 -s3.config=/etc/s3.json`.

Start with `docker compose up -d`, then point `.env` at the local services (these are the `.env.example`
defaults): `DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app"`,
`BUCKET_ENDPOINT="http://localhost:8333"`, `BUCKET_FORCE_PATH_STYLE="true"`.

> No init sidecar or console needed: SeaweedFS creates buckets automatically on the first write.
> The identity config is **required** — SeaweedFS with no configured identity rejects AWS-SDK-signed requests.
> Email is the one service without a local emulator: magic-link sends go through real SES even in dev.

## Step 11 — next.config.ts

The default config — no options needed:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
```

> Railpack (Step 43) handles the production build and startup on Railway — no `output: "standalone"` or other
> deployment-specific options required.

## Step 12 — `lib/constants.ts`

Compile-time project constants. The first file to edit after cloning.

```ts
export const APP_NAME = "Your App";
```

> Used in: magic link email subject/header, home page `<h1>`, browser tab title (`metadata.title` in root layout), sidebar header.
> Do not put runtime config here — that belongs in `lib/env.ts`.

## Step 13 — Project Structure (Feature-Sliced Design)

New features live in `features/`, keeping business logic out of the Next.js `app/` router segments:

```
features/          ← one folder per product feature
  todos/           ← DEMO ONLY — delete after internalizing the pattern
    components/    ← React components for this feature
    actions.ts     ← server actions ("use server" at the top, all actions in one file)
    data.ts        ← Drizzle queries
    schemas.ts     ← shared Zod schemas (used by both actions and forms)
  subscriptions/   ← subscription gating (always present when Stripe is enabled)
    data.ts        ← getSubscription + isSubscribed queries
components/ui/     ← shadcn components
hooks/             ← shared React hooks (use-mobile from shadcn)
db/                ← Drizzle schema, client, seed
emails/            ← react-email templates
lib/               ← env (t3-env), auth (+ verifySession), auth-client, constants, email, storage, safe-action, utils
scripts/           ← smoke test (test.ts)
proxy.ts           ← Next.js proxy: redirects unauthenticated /dashboard traffic to /sign-in
app/               ← Next.js App Router (routing only — no business logic)
  api/
    auth/          ← better-auth catch-all route
    cron/          ← scheduled-job stub, guarded by CRON_SECRET
    health/        ← GET → 200 ok / 503 error
  dashboard/       ← protected shell
    layout.tsx     ← renders AppSidebar + SidebarInset; calls verifySession for sidebar user info
    page.tsx       ← welcome card + subscription status card
    todos/         ← todos feature page (demo — delete when done)
    settings/      ← account info + billing (plan badge + Stripe checkout/portal)
  sign-in/         ← Google OAuth button + magic link email input
  page.tsx         ← minimal home page: APP_NAME h1, tagline, session-aware CTA button
```

**Rules:**

- `features/` may import from `lib/`, `db/`, `components/ui/` — but never from other features.
- `app/` route segments import from `features/` and `lib/auth` for session checks.
- Adding a feature: create `features/<name>/` with `components/`, `actions.ts`, `data.ts`, `schemas.ts` — only the pieces the feature needs.
- **No barrel files** — import directly from the file that defines the symbol (`@/features/todos/data`, `@/features/todos/components/todo-form`).
- `schemas.ts` defines Zod schemas shared between the action input validation and the react-hook-form `resolver`. Define once, use in both.
- Add a nav entry in `components/app-sidebar.tsx` `navItems` array to expose the feature in the sidebar.

## Step 14 — Drizzle Schema

Split into two files: `auth.ts` (generated) and `index.ts` (application tables + re-export).

**`db/schema/auth.ts`** — better-auth tables (run `pnpm auth:generate` to regenerate):

- Use **plural** table names: `users`, `sessions`, `accounts`, `verifications`
- This is required by `usePlural: true` in the drizzle adapter
- The `@better-auth/stripe` plugin owns the `subscriptions` table and adds a `stripeCustomerId` column to `users`. Both live here (the plugin's schema is part of better-auth's generated output).

**`db/schema/index.ts`** — application tables (todos), plus `export * from "./auth"` so `@/db/schema` exposes
everything:

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

## Step 15 — drizzle.config.ts

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./db/schema/index.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

> Use `process.env` directly — `@/*` aliases don't resolve in drizzle.config.ts.

## Step 16 — DB client (`db/index.ts`)

Singleton pattern to prevent connection pool exhaustion during Next.js dev hot reloads:

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { env } from "@/lib/env";

const globalForDb = globalThis as unknown as { db: ReturnType<typeof drizzle> };

export const db = globalForDb.db ?? drizzle(postgres(env.DATABASE_URL), { schema, casing: "snake_case" });

if (process.env.NODE_ENV !== "production") globalForDb.db = db;
```

> In production, module code runs once — the guard is a no-op. In dev, hot reloads reuse the existing client.
> Always `db:generate` + `db:migrate` — never `db:push` in normal workflow. `db:push` is reserved for emergency schema fixes only.

## Step 17 — `app/api/auth/[...all]/route.ts`

```ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(auth);
```

> All auth routes — Google OAuth callbacks, magic link verification, Stripe webhooks (`/api/auth/stripe/webhook`) — go through this single catch-all.

## Step 18 — better-auth (`lib/auth.ts`)

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

Also export `verifySession` from `lib/auth.ts` for use in dashboard pages:

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

> `verifySession` is called by the dashboard layout (for sidebar user info) **and** by every protected page (as its
> auth guard). React `cache()` deduplicates — one DB hit per request regardless of how many times it's called.
> The plugin's webhook updates `status` to `active`, `trialing`, `canceled`, etc. — query it via `getSubscription` / `isSubscribed` (see Step 21).
> Checkout success redirects to the `successUrl` passed to `subscription.upgrade` (`/dashboard/settings?checkout=success`).

## Step 19 — `lib/auth-client.ts`

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

## Step 20 — Stripe product setup

1. Go to your [Stripe dashboard](https://dashboard.stripe.com) → Product catalog → add a product with a recurring price.
2. Copy the **Price ID** (e.g. `price_xxxxxxxxxxxxxxxx`) — not the product id.
3. Paste it into `STRIPE_PRICE_ID` in `.env`, and set `STRIPE_SECRET_KEY` (from Developers → API keys).
4. Get `STRIPE_WEBHOOK_SECRET` from the webhook endpoint (`pnpm stripe:dev` prints it locally, or create an endpoint in the dashboard pointing at `<BETTER_AUTH_URL>/api/auth/stripe/webhook`).

That's it. An **Upgrade to Pro** button appears in the dashboard automatically when signed in and `STRIPE_PRICE_ID` is set. It calls `authClient.subscription.upgrade({ plan })` and redirects to Stripe Checkout.

**Checkout flow wired in `components/checkout-button.tsx`:**

```ts
await authClient.subscription.upgrade({
  plan: "pro", // matches the plan name in auth.ts
  successUrl: "/dashboard/settings?checkout=success",
  cancelUrl: "/dashboard/settings",
});
```

**Manage / cancel** is wired in `components/manage-subscription-button.tsx` via the Stripe billing portal:

```ts
await authClient.subscription.billingPortal({ returnUrl: "/dashboard/settings" });
```

**Webhooks** are handled entirely by the plugin (`/api/auth/stripe/webhook`) — it upserts the `subscriptions` table on every `customer.subscription.*` event and resolves the user via `stripeCustomerId`. No manual handler to write.

> Local webhook testing: `pnpm stripe:dev` (Stripe CLI `stripe listen`) forwards events to `/api/auth/stripe/webhook` and prints the signing secret to put in `STRIPE_WEBHOOK_SECRET`.

## Step 21 — Server action clients + subscription gating (`lib/safe-action.ts`)

The template assumes a freemium model: users access the app for free and optionally upgrade to Pro.

**`features/subscriptions/data.ts`** — query subscription status:

```ts
// The Stripe plugin keeps `subscriptions` in sync; `referenceId` holds the user id.
// The template enforces one subscription per user, but if duplicate rows ever
// appear (e.g. a canceled one alongside an active one), prefer the live one.
export async function getSubscription(userId: string) {
  const rows = await db.query.subscriptions.findMany({
    where: eq(subscriptions.referenceId, userId),
  });
  return rows.find((row) => row.status === "active" || row.status === "trialing") ?? rows[0];
}

export async function isSubscribed(userId: string) {
  const subscription = await getSubscription(userId);
  return subscription?.status === "active" || subscription?.status === "trialing";
}
```

**`lib/safe-action.ts`** — action clients with an `ActionError` class for user-facing error messages:

```ts
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";

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
```

Use `authActionClient` for actions available to all signed-in users. Use `proActionClient` for Pro-only actions.

For gating UI in Server Components, call `isSubscribed(session.user.id)` directly.

> next-safe-action **masks** thrown errors by default — without `handleServerError`, every `serverError` reads
> "Something went wrong while executing the operation." Throw `new ActionError("...")` for messages the user
> should see; anything else (DB errors, Stripe exceptions) stays masked and never leaks to the client.

## Step 22 — Error handling convention (next-safe-action + react-hook-form)

Apply everywhere:

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

## Step 23 — Root layout (`app/layout.tsx`)

- `<html lang="en" suppressHydrationWarning>` — the attribute silences the next-themes hydration mismatch.
- `metadata.title` is `APP_NAME` from `lib/constants.ts`.
- Provider nesting inside `<body>`: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` →
  `<TooltipProvider>` → `{children}` + `<Toaster />` (the shadcn sonner wrapper).
- `<Toaster />` must sit inside `<ThemeProvider>` — it reads `useTheme`.

## Step 24 — Dashboard layout (`app/dashboard/layout.tsx`)

An async layout that calls `verifySession()` and renders `<SidebarProvider>` → `<AppSidebar user={session.user} />`
plus `<SidebarInset>{children}</SidebarInset>`.

> The layout calls `verifySession()` for the sidebar user info. Each protected page **also** calls it as its own
> guard — React `cache()` deduplicates the DB hit (see Step 18).

## Step 25 — Route protection (`proxy.ts`)

Next.js 16 proxy (the successor to `middleware.ts` — the file must be `proxy.ts` with a named
`export function proxy(request: NextRequest)`). Behavior:

- `config.matcher = ["/dashboard/:path*"]`
- If `getSessionCookie(request)` (from `"better-auth/cookies"`) returns nothing, redirect to `/sign-in`;
  otherwise `NextResponse.next()`.

> This is an **optimistic** check — `getSessionCookie` only tests for the cookie's presence, it does not validate
> the session against the DB. It exists for fast redirects, not security. The real guard remains `verifySession()`
> in the layout and every protected page (Step 18). Do not add DB or fetch calls here.

## Step 26 — App sidebar (`components/app-sidebar.tsx`)

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

## Step 27 — Home page (`app/page.tsx`)

Minimal landing page with a session-aware CTA. Not a redirect — an actual shippable page.

- Server Component; reads the session via `auth.api.getSession({ headers: await headers() })`.
- Renders `APP_NAME` as the `<h1>`, a one-line tagline (replace per project), and one CTA link:
  to `/dashboard` ("Go to Dashboard") when signed in, `/sign-in` ("Get Started") otherwise —
  styled with `buttonVariants({ size: "lg" })` on a `<Link>` (no `asChild`, see Gotcha 1).
- No nav bar, no features section, no footer.

## Step 28 — Sign-in page (`app/sign-in/page.tsx`)

Supports **two methods only**:

- **Google OAuth** — "Continue with Google" button calls `signIn.social({ provider: "google", callbackURL: "/dashboard" })`
- **Magic link** — email input calls `authClient.signIn.magicLink({ email, callbackURL: "/dashboard" })`, user receives a link via email

Email+password is **not** included. Do not add it.

Google OAuth requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` set in env. Configure the OAuth client in [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0 Client IDs. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

## Step 29 — Dashboard overview page (`app/dashboard/page.tsx`)

Shows two cards only:

1. **Welcome card** — user's name and email (from session)
2. **Subscription card** — "Free" or "Pro" status badge + "Upgrade to Pro" button (calls `authClient.subscription.upgrade`) when not subscribed; "Manage subscription" billing-portal link when subscribed

No placeholder stats, no fake charts. Both pieces of data are real and immediately useful.

## Step 30 — Settings page (`app/dashboard/settings/page.tsx`)

Two sections:

1. **Account** — user's name and email (read-only, from `verifySession()`)
2. **Billing** — current plan badge ("Free" or "Pro") + "Upgrade to Pro" checkout button (`authClient.subscription.upgrade`) when not subscribed, or "Manage subscription" Stripe billing portal link (`authClient.subscription.billingPortal()`) when subscribed

No password change (no password in this stack). No danger zone by default — add account deletion per project if needed.

## Step 31 — Todos feature (demo scaffolding)

**Delete `features/todos/` and `app/dashboard/todos/` once you've internalized the FSD pattern.**

A todos CRUD that exercises every convention in the stack. Implement it as a full FSD slice (`components/`,
`actions.ts`, `data.ts`, `schemas.ts`); the exact component breakdown is up to you as long as it demonstrates:

- **List** — Server Component fetching via `data/` queries, scoped to the current user
- **Create** — `authActionClient` action + react-hook-form form (`useAction`)
- **Toggle complete** — `useOptimisticAction` for instant feedback, ownership-checked in the action
- **Bulk delete** (e.g. "delete completed") — a second mutation to show the pattern twice
- **Attachment** — presigned S3 upload + download via actions (Step 34)
- **Error convention** — validation errors inline, server errors as toast (Step 22)

**`features/todos/schemas.ts`** — shared between actions and forms:

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

**Upload flow (two steps):**

1. Client calls a `getUploadUrl` action → receives presigned URL + S3 key (from `getPresignedUploadUrl()` in `lib/storage.ts`)
2. Client uploads the file directly to S3 via `fetch(presignedUrl, { method: "PUT", body: file })`
3. Client calls the `createTodo` action with the resulting S3 key as `attachmentKey`

Downloads work the same way in reverse: an action returns a presigned download URL via `getPresignedDownloadUrl()`.

## Step 32 — getBaseUrl utility (`lib/utils.ts`)

```ts
export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
```

> `BETTER_AUTH_URL` is already required and contains the full URL with protocol — no platform-specific env var needed.

## Step 33 — Email (`lib/email.ts`)

Sends through **Amazon SES** (`@aws-sdk/client-sesv2`) using the shared AWS credentials.

- A module-level `SESv2Client` configured with `env.AWS_REGION` and the `env.AWS_ACCESS_KEY_ID` /
  `env.AWS_SECRET_ACCESS_KEY` pair.
- One exported function — the contract the auth config depends on:
  `sendEmail({ to, subject, react }: { to: string; subject: string; react: ReactElement })`.
  It awaits `render(react)` (react-email v6's `render` is async) and sends a `SendEmailCommand` with
  `FromEmailAddress: env.EMAIL_FROM` and simple HTML content.

> react-email v6 ships as a single unified package: import `render` and all components from `"react-email"`.
> Do **not** install `@react-email/components` or `@react-email/render` — deprecated.

**`emails/magic-link.tsx`** — a `MagicLinkEmail({ url })` React component: preview + heading
"Sign in to {APP_NAME}", a sentence noting the link expires in 10 minutes, a sign-in `<Button href={url}>`,
the raw URL as copyable text, and an "if you didn't request this, ignore it" line. Built entirely from
react-email components (`Html`, `Head`, `Preview`, `Body`, `Container`, `Heading`, `Section`, `Text`, `Button`).

Preview templates with `pnpm email:dev` (react-email dev server) — no SES account needed for template work.

> **SES setup:** verify `EMAIL_FROM` as an SES identity (address or domain) in the AWS console. New SES accounts
> start in **sandbox mode**, where recipients must also be verified — request production access before real users
> sign in via magic link. Actual sends (including local dev sign-ins) go through the real SES API.

## Step 34 — AWS S3 Object Storage (`lib/storage.ts`)

Thin wrappers around `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` against a private S3 bucket.

- A module-level `S3Client` — constructing one makes no network calls and the AWS credentials are always
  present. Config: `region: env.AWS_REGION`, `endpoint: env.BUCKET_ENDPOINT` (undefined for real AWS — only set
  for S3-compatible hosts), `forcePathStyle: env.BUCKET_FORCE_PATH_STYLE`, and the shared credentials.
- Exported functions, all passing `Bucket: env.BUCKET_NAME`: `uploadFile(key, body, contentType?)`,
  `downloadFile(key)`, `deleteFile(key)`, `listFiles(prefix?)`, and `getPresignedUploadUrl(key, contentType?,
expiresIn = 3600)` / `getPresignedDownloadUrl(key, expiresIn = 3600)` via `getSignedUrl`.
- No gating: `BUCKET_NAME` defaults to `"uploads"`, so storage is always available.

Keep the bucket **private** (block public access) and serve files through presigned URLs or an authenticated
backend route.

## Step 35 — `app/api/health/route.ts`

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

## Step 36 — `app/api/cron/route.ts`

A stub `GET` endpoint for scheduled jobs, empty by default — add project-specific work per project. Behavior:

- Returns `401 { error: "Unauthorized" }` unless `env.CRON_SECRET` is set **and** the request carries
  `Authorization: Bearer <CRON_SECRET>` (unset secret = endpoint disabled, same optional-feature pattern as
  Stripe).
- Otherwise runs the scheduled work and returns `{ status: "ok" }`.

> The scheduler (Railway cron, GitHub Actions, etc.) must send the `Authorization: Bearer` header.

## Step 37 — package.json Scripts

```json
{
  "dev": "next dev",
  "dev:all": "concurrently --names \"next,studio,stripe\" \"pnpm dev\" \"pnpm db:studio\" \"pnpm stripe:dev\"",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "postlint": "tsc --noEmit",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "db:generate": "drizzle-kit generate",
  "db:migrate": "drizzle-kit migrate",
  "db:push": "drizzle-kit push",
  "db:studio": "drizzle-kit studio",
  "db:seed": "tsx db/seed.ts",
  "email:dev": "email dev emails",
  "stripe:dev": "stripe listen --forward-to localhost:3000/api/auth/stripe/webhook",
  "auth:generate": "better-auth generate --output db/schema/auth.ts --yes",
  "test": "tsx --env-file=.env scripts/test.ts"
}
```

> `db:seed` is empty by default — add project-specific seed data per project.
> `postlint` runs `tsc --noEmit` automatically after every lint run.
> `stripe:dev`: forward Stripe events to the local app via the Stripe CLI (`stripe listen`). Requires `stripe login` once.
> Railpack handles the production build and container startup — no Railway-specific build/start scripts needed.

## Step 38 — `scripts/test.ts` (smoke test)

Verifies the environment is wired correctly after cloning. Run with `pnpm test` (tsx loads `.env` via
`--env-file`). Sequential checks, exiting non-zero on the first failure:

1. **Database** — execute `SELECT 1` through the Drizzle client.
2. **Storage** — dynamic-import `listFiles()` from `lib/storage.ts` and call it (verifies the bucket is
   reachable with the configured credentials).
3. **Stripe** (optional) — if `env.STRIPE_SECRET_KEY` is set, just confirm its presence.

Each passing check logs a `✓` line; the script ends with "All checks passed." and `process.exit(0)`.

## Step 39 — Format and Verify

Once all files are in place, normalize the codebase and run the full check pipeline:

```bash
pnpm format
pnpm lint
```

`pnpm lint` runs in sequence: `eslint` (including Prettier as a lint rule) → `tsc --noEmit`. Use
`pnpm format:check` to verify Prettier separately.

## Step 40 — GitHub Actions CI (`.github/workflows/ci.yml`)

One `lint` job on `push`, five steps:

1. `actions/checkout@v7`
2. `pnpm/action-setup@v6` with **no `version` input** — it reads the pnpm version from `packageManager` in
   package.json, so it's pinned in exactly one place.
3. `actions/setup-node@v6` with `node-version: 24` and `cache: pnpm` (pnpm must be set up first for the cache).
4. `pnpm install --frozen-lockfile` — CI fails on lockfile drift instead of silently updating it.
5. `pnpm format:check`, then `pnpm lint`.

> `pnpm lint` already covers ESLint + Prettier-as-a-lint-rule + `tsc --noEmit` (via `postlint`); `format:check`
> additionally verifies the files ESLint doesn't lint (Markdown, CSS, JSON, YAML).
> No `.env` is needed: neither Prettier, ESLint, nor `tsc` executes app code, so t3-env validation never runs.
> A production `next build` is deliberately not in CI — it executes `lib/env.ts`, which would demand real
> env values. Railway's deploy build (with its service variables) covers that path.

## Step 41 — AWS Infrastructure (`infra/`, Terraform)

Terraform in `infra/` provisions everything a project needs on AWS, using the latest `terraform-aws-modules`
(`s3-bucket` ~> 5.0; `iam` ~> 6.0 for both the `iam-user` and `iam-policy` submodules — no raw
`aws_iam_policy` resources). Workspaces map to environments: `default` = dev (resources prefixed
`<project>-dev`), `production` = production (prefixed `<project>`).

**Layout & conventions** (`main.tf`, `variables.tf`, `terraform.tfvars`, `outputs.tf`):

- S3 backend (`nimbusit-terraform-state`, `use_lockfile`) — change the state `key` per project.
- Single AWS provider in `us-east-1` with `default_tags` of `Project` + `Environment`.
- Variables: `project_name` and `production_domain` (validated non-empty; scopes SES sending and S3 CORS).
  `terraform.tfvars` holds per-project values — edit after cloning.
- Locals: `environment` from `terraform.workspace`, `prefix` as described above.

**Application resources** (`app.tf`):

- **Uploads bucket** (`<prefix>-uploads`, s3-bucket module): private (default public-access block), with
  `attach_require_latest_tls_policy` + `attach_deny_insecure_transport_policy`, and a CORS rule allowing
  `GET`/`PUT` with `Content-Type` from `http://localhost:3000` (dev) or `https://www.<production_domain>`
  (production) — required for the browser's direct presigned PUT/GET.
- **App user** (`<prefix>-app`, iam-user module, no login profile) with two policies via the iam-policy module
  (policy documents authored as `data.aws_iam_policy_document`):
  - `<prefix>-app-s3-access` — `s3:*` on the uploads bucket and its objects only.
  - `<prefix>-app-ses-send` — `ses:SendEmail` + `ses:SendRawEmail` on `*`, conditioned to
    `ses:FromAddress` matching `*@<production_domain>`.

**Backup resources** (`backups.tf`, created only when `environment == "production"` via `count`):

- **Backups bucket** (`<prefix>-database-backups`): versioned, AES256 server-side encryption, TLS policies as
  above, and a lifecycle rule — current versions expire after 30 days, noncurrent after 1 day (each backup is a
  uniquely named object, so this is the retention mechanism; the backup container never deletes).
- **Backup user** (`<prefix>-database-backup`, no login profile) with a single policy allowing only
  `s3:PutObject` on the backups bucket's objects.

**Outputs**: `aws_region`, app user `access_key_id` / `access_key_secret` (sensitive), `bucket_id`,
`ses_from_email` (`no-reply@<production_domain>`), and the production-only `backups_bucket_id` /
`backup_user_access_key_id` / `backup_user_access_key_secret` (null in dev).

Also add to `.gitignore`: `infra/.terraform/`, `*.tfstate*`, `.env.infra` — and **commit**
`infra/.terraform.lock.hcl`.

**`infra/README.md`** documents the apply flow and a quick script that writes the app outputs to
`../.env.infra` (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `BUCKET_NAME`, `EMAIL_FROM`)
for copying into `.env`.

> `terraform init && terraform apply` for dev; `terraform workspace new production && terraform apply` for
> production.
> SES **verification** is not provisioned — verify the domain in the SES console and request production access.

## Step 42 — Database backup service (`backup/`)

A minimal Railway cron container in `backup/`: dump the database, upload to S3, exit. Retention is the backups
bucket's lifecycle rule (Step 41) — the container only ever uploads, never lists or deletes.

- **`Dockerfile`** — `FROM postgres:18-alpine` (pg_dump must match the server's major version) plus
  `apk add aws-cli`; copies in `backup.sh` as the entrypoint.
- **`backup.sh`** (`set -eu`; requires `DATABASE_URL` and `BACKUP_BUCKET`):
  `pg_dump --no-owner --no-privileges | gzip -9` to a temp file, **abort if the dump is under 100 bytes**
  (suspiciously small), then `aws s3 cp` to `s3://$BACKUP_BUCKET/db/YYYY/MM/DD/<ISO-timestamp>.sql.gz`.
- **`railway.json`** — `DOCKERFILE` builder with `watchPatterns: ["backup/**"]`, `cronSchedule: "0 6 * * *"`
  (daily 06:00 UTC), `restartPolicyType: "NEVER"` (run-and-exit).

Deploy as a second Railway service with root directory `backup/`, connected to the same repo. Set its variables
from the production Terraform outputs: `DATABASE_URL` (reference the Postgres service — private network),
`BACKUP_BUCKET`, `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (the **backup** user, not the app user), and
`AWS_REGION`.

## Step 43 — Deployment on Railway

Uses **Railpack** for building. Railpack auto-detects Next.js and handles the production build and startup automatically.

File: `railway.json` (minimal — Railpack handles the rest):

```json
{
  "deploy": {
    "preDeployCommand": "pnpm db:migrate",
    "healthcheckPath": "/api/health",
    "healthcheckTimeout": 60
  }
}
```

1. Create a Railway project and deploy this repository from GitHub or with `railway up`.
2. Add a PostgreSQL service and reference its `DATABASE_URL` from the app service.
3. Generate a public app domain, then set `BETTER_AUTH_URL=https://${{RAILWAY_PUBLIC_DOMAIN}}`.
4. Configure Google OAuth with `<BETTER_AUTH_URL>/api/auth/callback/google`.

**Required app service variables:**

```
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_FROM=
AWS_REGION=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
```

**Optional app service variables (blank Stripe/cron vars disable the feature; `BUCKET_NAME` just overrides the `"uploads"` default):**

```
CRON_SECRET=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_ID=
BUCKET_NAME=
BUCKET_ENDPOINT=
```

`DATABASE_URL` should reference the Railway Postgres service. The AWS key pair (SES + S3 bucket) comes
from your AWS account — create one IAM user with `ses:SendEmail` plus scoped access to the project bucket. For
local development, link the project with the Railway CLI and run commands through `railway run`, which injects
the same service variables locally.

> Also compatible with **Dokploy** and any other platform that supports Railpack.

---

## Step 44 — `AGENTS.md`

Create `AGENTS.md` at the repo root (replace the one `create-next-app` scaffolds, if any). It is built from a
base plus two project sections:

**Base — behavioral guidelines.** Copy the contents of
https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md (retitled to `AGENTS.md`): four rules
for LLM coding discipline — Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution.

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

Finally, create a `CLAUDE.md` at the repo root whose entire content is one import line, so Claude Code loads
the same instructions:

```md
@AGENTS.md
```

## Step 45 — AI Configuration (Skills)

Configure your AI coding assistant with first-party knowledge packs for every tool in this stack.

### Claude Code Skills

Install structured knowledge packs so the AI knows each library's conventions:

```bash
pnpm dlx skills add shadcn/ui
pnpm dlx skills add better-auth/skills
pnpm dlx skills add next-safe-action/skills
```

| Skill                | What it teaches                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| **shadcn/ui**        | Component patterns, `buttonVariants`, theming, registry authoring. Auto-activates when `components.json` is present. |
| **better-auth**      | Library conventions, safe patterns, plugin setup (6 packs: best-practices, security, email/password, org, 2FA)       |
| **next-safe-action** | Client creation, middleware, hooks, forms, error handling, better-auth + TanStack Query integrations (9 packs)       |

> Skills install into `.agents/` and are auto-discovered by Claude Code.
> `.agents/` is gitignored — run the installs above once per project instead of committing the packs.
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

9. **Object storage** — always available: the AWS credentials are required anyway (SES), and `BUCKET_NAME`
   defaults to `"uploads"`. Create the bucket in your AWS account; set `BUCKET_NAME` only to override the name.

10. **One AWS key pair** — `AWS_REGION` + `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` serve both SES (email)
    and S3 (storage). Leave `BUCKET_ENDPOINT` unset for real AWS — it and `BUCKET_FORCE_PATH_STYLE=true` exist
    only as escape hatches for S3-compatible hosts (e.g. MinIO).

11. **Tailwind v4** — config lives in `globals.css` via `@import "tailwindcss"`, not `tailwind.config.js`.

12. **Railway migrations** — use Railway's pre-deploy command (`pnpm db:migrate`), not `postbuild`, so a failed
    migration prevents the new deployment from replacing the healthy previous deployment.

13. **shadcn sidebar — base-ui `render` prop** — `SidebarMenuButton` uses base-ui's `useRender`, so pass `render={<Link href="..." />}` instead of `asChild`. It also accepts `isActive` and `tooltip` props.

14. **Sonner + next-themes** — `<Toaster />` from `@/components/ui/sonner` uses `useTheme`. Wrap root layout with `<ThemeProvider attribute="class">` before `<TooltipProvider>`. Add `suppressHydrationWarning` to `<html>` to silence theme hydration mismatch.

15. **Todos feature** — demo scaffolding only. Delete `features/todos/` and `app/dashboard/todos/` once you've internalized the FSD pattern. Do not ship it.

16. **getBaseUrl** — lives in `lib/utils.ts`, reads `BETTER_AUTH_URL` on the server. No platform-specific env var needed. Always set `BETTER_AUTH_URL` in production.

17. **Railpack** — auto-detects Next.js and handles the production build and container startup with the default `next.config.ts` (no `output: "standalone"` needed). Do not add `build:railway` or `start:railway` scripts; the standard `pnpm build` and `pnpm start` are sufficient for local use.

18. **`verifySession`** — exported from `lib/auth.ts`, wrapped in React `cache()`. Called in both the dashboard layout (for sidebar user info) and each protected page (auth guard). Cache deduplicates — one DB hit per request regardless of how many times it's called.

19. **`lib/constants.ts`** — only `APP_NAME`. Do not add runtime values (those go in `lib/env.ts`). First thing to update after cloning.

20. **Shared schemas** — define Zod schemas in `features/<name>/schemas.ts`. Import them in both the safe action (`input: schema`) and the form (`resolver: zodResolver(schema)`). Never duplicate schemas.

21. **Optimistic updates** — use `useOptimisticAction` for toggle (instant feedback) and `useAction` for create (multi-step upload flow). Do not use `useOptimisticAction` for actions with async side effects like file uploads.

22. **`db:push` is not part of the workflow** — always use `db:generate` + `db:migrate`. `db:push` exists for emergencies only, never for normal schema iteration.

23. **`next-themes`** — install explicitly (`pnpm add next-themes`). Do not rely on it being pulled in transitively by shadcn.

24. **Stripe client** — initialized in `lib/auth.ts` as `const stripeClient = env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET ? new Stripe(...) : null`. The `stripe` package must be in production deps. Subscription "active" checks include `trialing`, not just `active` (see `isSubscribed` / `proActionClient`).

25. **Server errors are masked by default** — next-safe-action replaces thrown error messages with a generic string. Throw `new ActionError("...")` (from `lib/safe-action.ts`) for any message the user should actually see in a toast; plain `Error`s stay masked.

26. **Empty env vars count as unset** — `emptyStringAsUndefined: true` in `lib/env.ts` means `VAR=""` fails required-var validation at boot and disables optional features cleanly. Don't "temporarily" set a required var to `""` expecting the app to boot.

27. **CLI packages** — `shadcn` (prod dep) provides the pinned `pnpm shadcn` CLI; `auth` (dev dep) is the Better Auth CLI providing the `better-auth` binary for `auth:generate`. Both are required — do not remove them as "unused".

28. **SES identity + sandbox** — `EMAIL_FROM` must be a verified SES identity, and new SES accounts start in sandbox mode (recipients must be verified too). Request production access before launch or magic-link sign-in will fail for unverified addresses. There is no SMTP/nodemailer path in this stack — all email goes through `@aws-sdk/client-sesv2`.

29. **`proxy.ts` is not the auth guard** — it only checks that a session cookie exists (`getSessionCookie`), for fast redirects. Never rely on it for security and never add DB/fetch calls to it; `verifySession()` in pages is the real guard. Next.js 16 renamed `middleware.ts` to `proxy.ts` — do not create a `middleware.ts`.

30. **No barrel files in features** — import directly from the defining file (`@/features/<name>/data`, `@/features/<name>/components/<component>`). Server actions live in a single `actions.ts` per feature with `"use server"` at the top; queries in `data.ts`.

31. **One subscription per user** — the Stripe plugin does _not_ prevent duplicates: `subscription.upgrade` without a `subscriptionId` creates a second subscription alongside the existing one (duplicate billing). Never call `upgrade` for an already-subscribed user — the UI must only offer Upgrade when not subscribed (billing portal otherwise). `getSubscription` prefers the active/trialing row if duplicates ever appear.
