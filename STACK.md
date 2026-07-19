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
| Object storage  | Any S3-compatible bucket + AWS SDK v3                 |
| Formatting      | Prettier (organize-imports + tailwindcss plugins)     |
| Linting         | ESLint v9 flat config + drizzle + prettier            |
| TypeScript base | @tsconfig/strictest + @tsconfig/next                  |
| Script runner   | tsx                                                   |
| Dev concurrency | concurrently                                          |
| Local services  | Docker Compose (Postgres 18)                          |
| CI              | GitHub Actions (lint + types)                         |
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
  better-auth @better-auth/drizzle-adapter @better-auth/stripe stripe \
  @t3-oss/env-nextjs \
  @paralleldrive/cuid2 \
  next-themes \
  react-email \
  shadcn \
  @aws-sdk/client-sesv2 @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

> `shadcn` is the shadcn CLI as a project dependency — run component adds through `pnpm shadcn`, not `@latest`.

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

> shadcn v4 uses `@base-ui/react` — there is **no `asChild` prop** (see Key Gotchas).
> Wrap the root layout with `<ThemeProvider>`, `<TooltipProvider>`, and `<Toaster />` (sonner).

## Step 5 — Config files

Three files, written together. `tsconfig.json`:

```json
{
  "extends": ["@tsconfig/strictest", "@tsconfig/next"],
  "compilerOptions": {
    "target": "esnext",
    "noPropertyAccessFromIndexSignature": false,
    "exactOptionalPropertyTypes": false,
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", ".next/dev/types/**/*.ts", "**/*.mts"],
  "exclude": ["node_modules", ".next"]
}
```

`prettier.config.mjs`:

```js
/** @type {import("prettier").Config} */
const config = {
  printWidth: 120,
  plugins: ["prettier-plugin-organize-imports", "prettier-plugin-tailwindcss"],
};
export default config;
```

`eslint.config.mjs`:

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

> `prettierRecommended` must come **after** the other configs. It runs Prettier as a lint rule, making `pnpm lint`
> a single gate over lint + formatting + types (`postlint` runs `tsc --noEmit`).

## Step 6 — Environment Variables

Write this template to a committed `.env.example`, then `cp .env.example .env` and replace the placeholders with
real values. The placeholders are **syntactically valid on purpose** — they pass `lib/env.ts` validation so the
app builds anywhere (CI copies this file verbatim, Step 35), but nothing works against real services until
replaced:

```env
# Copy to .env and replace the placeholder values with real credentials.
# Placeholders are syntactically valid so the app builds (CI copies this file verbatim),
# but nothing works against real services until replaced.
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/app" # compose.yaml default; override in production
BETTER_AUTH_SECRET="00000000000000000000000000000000" # placeholder — generate: openssl rand -base64 32
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="placeholder"
GOOGLE_CLIENT_SECRET="placeholder"

# Email — Amazon SES. SES_* holds the app IAM user's key pair (infra/, Step 36).
EMAIL_FROM="dev@example.com" # must be a verified SES identity (address or domain)
SES_REGION="us-east-1"
SES_ACCESS_KEY_ID="placeholder"
SES_SECRET_ACCESS_KEY="placeholder"

# Object storage — the uploads bucket from infra/ (Step 36). BUCKET_* holds the same app user's key pair.
BUCKET_REGION="us-east-1"
BUCKET_ACCESS_KEY_ID="placeholder"
BUCKET_SECRET_ACCESS_KEY="placeholder"
BUCKET_NAME="placeholder"
# Leave both blank for AWS S3. Set them to point at another S3-compatible host.
BUCKET_ENDPOINT=""
BUCKET_FORCE_PATH_STYLE="" # "true" for hosts that address buckets by path instead of subdomain

# Optional — cron endpoint auth. Leave blank to disable /api/cron entirely. Generate like BETTER_AUTH_SECRET.
CRON_SECRET=""

# Optional — Stripe billing. Leave blank to disable the billing layer entirely.
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
STRIPE_PRICE_ID=""
```

> Everything except the Stripe and cron block is required. Empty strings count as **unset** (Step 7).
> The `SES_*` and `BUCKET_*` pairs both hold the **single app IAM user's** credentials (Step 36); they stay
> separate variables so the user can be split later without touching app code.
> Locally, `docker compose up -d` (Step 8) provides Postgres. Storage and email use real AWS in every environment.

## Step 7 — lib/env.ts (t3-env)

Validate all env vars with Zod v4. Stripe and cron vars are optional and runtime-guarded; both AWS key pairs are
**required** (SES sends the magic-link email, and storage has no fallback bucket).

```ts
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
```

> Never name these `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — the AWS SDK's default credential chain picks
> those up implicitly. The `SES_*` / `BUCKET_*` prefixes force both clients to be handed credentials explicitly.

Set `emptyStringAsUndefined` on the `createEnv` call:

```ts
export const env = createEnv({
  server: {/* schema above */},
  client: {},
  runtimeEnv: {/* list every var explicitly: DATABASE_URL: process.env.DATABASE_URL, ... */},
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
```

> Stripe is an all-or-nothing optional feature. The direct startup check rejects partial configuration; never
> substitute empty strings for a missing Stripe secret, webhook secret, or Price ID.

## Step 8 — compose.yaml (local development)

One service for local development. Compose reads `./.env` automatically for `${VAR}` interpolation, and all state
lives under `./.data` (add `/.data` to `.gitignore`).

- **postgres** — `postgres:18` on port 5432, data mounted at `./.data/postgres:/var/lib/postgresql`.
  Credentials interpolate with overridable defaults — `${POSTGRES_USER:-postgres}`,
  `${POSTGRES_PASSWORD:-postgres}`, `${POSTGRES_DB:-app}` — plus a `pg_isready` healthcheck.

Start with `docker compose up -d`; the `.env.example` `DATABASE_URL` default already points at it.

> **Pin the major version — never `postgres:latest`.** This tag must match the backup container's base image
> (Step 37) and the Railway Postgres service; `pg_dump` refuses to dump a server newer than itself. Bump all three
> together.
> There is no local S3 emulator or mail catcher. Use the dev bucket Terraform's dev environment provisions
> (`<project>-dev-uploads`, `build/dev.tfvars`, Step 36).

## Step 9 — next.config.ts

Leave it at the scaffolded default — an empty `NextConfig` object.

> Railpack (Step 38) handles the production build and startup on Railway — no `output: "standalone"` needed.

## Step 10 — `lib/constants.ts`

Compile-time project constants. The first file to edit after cloning.

```ts
export const APP_NAME = "Your App";
```

> Used in: magic link email subject/header, home page `<h1>`, browser tab title, sidebar header.
> Runtime config belongs in `lib/env.ts`, not here.

## Step 11 — Project Structure (Feature-Sliced Design)

New features live in `features/`, keeping business logic out of the Next.js `app/` router segments:

```
features/          ← one folder per product feature
  todos/           ← DEMO ONLY — delete after internalizing the pattern
    components/    ← React components for this feature
    actions.ts     ← server actions ("use server" at the top, all actions in one file)
    data.ts        ← Drizzle queries
    schemas.ts     ← shared Zod schemas (used by both actions and forms)
  subscriptions/   ← billing UI (always present when Stripe is enabled)
    components/    ← checkout and billing-portal controls
components/ui/     ← shadcn components
hooks/             ← shared React hooks (use-mobile from shadcn)
db/                ← Drizzle schema, client, seed
emails/            ← react-email templates
lib/               ← env (t3-env), auth (+ verifySession), auth-client, constants, email, storage, safe-action,
                     subscriptions (getSubscription + isSubscribed), utils
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

- `lib/` may import from `db/` and other `lib/` modules, but never from `app/`, `features/`, or `components/`.
  Shared business-rule queries (e.g. `lib/subscriptions.ts`) live here so infrastructure such as action middleware
  never depends on a feature slice.
- `features/` may import from `lib/`, `db/`, and `components/ui/` — but never from other features.
- `app/` route segments import from `features/`, `lib/auth` for session checks, and other `lib/` modules.
- Adding a feature: create `features/<name>/` with only the pieces it needs.
- **No barrel files** — import directly from the defining file (`@/features/todos/data`,
  `@/features/todos/components/todo-form`).
- `schemas.ts` defines Zod schemas shared between the action's `input` and the form's `resolver`. Define once, use
  in both — never duplicate.
- Add a nav entry in `components/app-sidebar.tsx` `navItems` to expose the feature in the sidebar.

## Step 12 — Drizzle Schema

Split into two files: `auth.ts` (generated) and `index.ts` (application tables + re-export).

**`db/schema/auth.ts`** — better-auth tables (run `pnpm auth:generate` to regenerate):

- Use **plural** table names: `users`, `sessions`, `accounts`, `verifications`. Required by `usePlural: true` in
  the drizzle adapter.
- The `@better-auth/stripe` plugin owns the `subscriptions` table and adds `users.stripeCustomerId`. Both live
  here — the plugin's schema is part of better-auth's generated output.

**`db/schema/index.ts`** — application tables, plus `export * from "./auth"` so `@/db/schema` exposes everything.
Use `@paralleldrive/cuid2` for IDs via `.$defaultFn(() => createId())`.

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

## Step 13 — drizzle.config.ts

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

## Step 14 — DB client (`db/index.ts`)

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

> Always `db:generate` + `db:migrate`. **`db:push` is not part of the workflow** — it exists for emergency schema
> fixes only, never for normal iteration.

## Step 15 — `app/api/auth/[...all]/route.ts`

Re-export `GET` and `POST` from better-auth's `toNextJsHandler(auth)` (`better-auth/next-js`).

> All auth routes — Google OAuth callbacks, magic link verification, Stripe webhooks
> (`/api/auth/stripe/webhook`) — go through this single catch-all.

## Step 16 — better-auth (`lib/auth.ts`)

Auth methods: **Google OAuth** (social) + **magic link** (passwordless). Email+password is not included, and
should not be added.

```ts
import { init } from "@paralleldrive/cuid2";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { stripe } from "@better-auth/stripe";
import { magicLink } from "better-auth/plugins";
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
        /* send email */
      },
    }),
    ...(stripePlugin ? [stripePlugin] : []),
  ],
});
```

> Leave `expiresIn` unset to use Better Auth's default magic-link lifetime. Store the verification token hashed,
> and keep the email copy duration-neutral so it cannot drift from the library default.

> **Rate limiting must stay enabled**, with `storage: "database"` (better-auth's default is memory, production
> only). Counters live in a `rateLimits` table — run `pnpm auth:generate`, then `db:generate` + `db:migrate`.
> The general limiter covers every auth endpoint, magic link included. **Do not add `customRules`.**
> The Stripe plugin handles checkout, the billing portal, **and** webhook persistence to the `subscriptions` table
> at `/api/auth/stripe/webhook` — do not write a manual webhook handler. `createCustomerOnSignUp` stores the
> customer id on `users.stripeCustomerId`. Add one entry to `plans` per Stripe Price you sell; `name` is what the
> client passes to `subscription.upgrade({ plan })`.

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
> auth guard). React `cache()` deduplicates it to one DB hit per request.

## Step 17 — `lib/auth-client.ts`

Always includes the Stripe plugin (costs nothing when Stripe is unconfigured). `subscription: true` exposes
`authClient.subscription.*` (upgrade, cancel, restore, list, billingPortal).

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

## Step 18 — Stripe product setup

1. [Stripe dashboard](https://dashboard.stripe.com) → Product catalog → add a product with a recurring price.
2. Copy the **Price ID** (e.g. `price_xxxxxxxxxxxxxxxx`) — not the product id — into `STRIPE_PRICE_ID`.
3. Set `STRIPE_SECRET_KEY` from Developers → API keys.
4. Get `STRIPE_WEBHOOK_SECRET` from the webhook endpoint — `pnpm stripe:dev` prints it locally, or create an
   endpoint in the dashboard pointing at `<BETTER_AUTH_URL>/api/auth/stripe/webhook`.

An **Upgrade to Pro** button then appears in the dashboard automatically when signed in and all three Stripe
variables are configured. Checkout is wired in `features/subscriptions/components/checkout-button.tsx`:

```ts
await authClient.subscription.upgrade({
  plan: "pro", // matches the plan name in auth.ts
  successUrl: "/dashboard/settings?checkout=success",
  cancelUrl: "/dashboard/settings",
});
```

Manage / cancel is wired in `features/subscriptions/components/manage-subscription-button.tsx` via the billing
portal:

```ts
await authClient.subscription.billingPortal({
  returnUrl: "/dashboard/settings",
});
```

> Webhooks are handled entirely by the plugin — it upserts `subscriptions` on every `customer.subscription.*`
> event. Status becomes `active`, `trialing`, `canceled`, etc.; query it via `getSubscription` / `isSubscribed`
> (Step 19).
> Local webhook testing: `pnpm stripe:dev` forwards events and prints the signing secret.

## Step 19 — Server action clients + subscription gating (`lib/safe-action.ts`)

The template assumes a freemium model: users access the app for free and optionally upgrade to Pro.

**`lib/subscriptions.ts`** — query subscription status (kept in `lib/`, next to the auth infrastructure that owns
the `subscriptions` table, so action middleware never imports from a feature slice):

```ts
// The Stripe plugin keeps `subscriptions` in sync; `referenceId` (not userId) holds the user id.
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
import { getSubscription } from "@/lib/subscriptions";
import { createSafeActionClient, DEFAULT_SERVER_ERROR_MESSAGE } from "next-safe-action";

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
  const subscription = await getSubscription(ctx.user.id);
  if (subscription?.status !== "active" && subscription?.status !== "trialing") {
    throw new ActionError("Pro subscription required");
  }
  return next({ ctx: { ...ctx, subscription } });
});
```

Use `authActionClient` for actions available to all signed-in users, `proActionClient` for Pro-only actions. For
gating UI in Server Components, call `isSubscribed(session.user.id)` directly.

> next-safe-action **masks** thrown errors by default. Throw `new ActionError("...")` for messages the user should
> see; anything else (DB errors, Stripe exceptions) stays masked and never reaches the client.
> This stack ships **no error tracker**. The `console.error` sends masked errors to Railway's logs, and that
> callback is the single hook point if you later add Sentry.

## Step 20 — Error handling convention (next-safe-action + react-hook-form)

Apply everywhere:

- **Validation errors** (`result.validationErrors`) — field-level, from Zod. Show inline below the field via
  react-hook-form's `setError`. Never toast these.
- **Server errors** (`result.serverError`) — auth failures, DB errors, business logic. Show as a Sonner toast.
  Never show inline.

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

> next-safe-action v8 uses Standard Schema — Zod v4 works natively, no adapter.
> The `onSuccess` callback receives `{ data, input }` as a single object.

## Step 21 — Root layout (`app/layout.tsx`)

- `<html lang="en" suppressHydrationWarning>` — the attribute silences the next-themes hydration mismatch.
- `metadata.title` is `APP_NAME` from `lib/constants.ts`.
- Provider nesting inside `<body>`: `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>` →
  `<TooltipProvider>` → `{children}` + `<Toaster />` (the shadcn sonner wrapper).
- `<Toaster />` must sit inside `<ThemeProvider>` — it reads `useTheme`.

## Step 22 — Dashboard layout (`app/dashboard/layout.tsx`)

An async layout that calls `verifySession()` and renders `<SidebarProvider>` → `<AppSidebar user={session.user} />`
plus `<SidebarInset>{children}</SidebarInset>`.

> Each protected page **also** calls `verifySession()` as its own guard; React `cache()` deduplicates (Step 16).

## Step 23 — Route protection (`proxy.ts`)

Next.js 16 proxy — the successor to `middleware.ts`. The file must be `proxy.ts` with a named
`export function proxy(request: NextRequest)`; do not create a `middleware.ts`.

- `config.matcher = ["/dashboard/:path*"]`
- If `getSessionCookie(request)` (from `"better-auth/cookies"`) returns nothing, redirect to `/sign-in`; otherwise
  `NextResponse.next()`.

> **This is not the auth guard.** `getSessionCookie` only tests for the cookie's presence; it does not validate
> the session. The real guard remains `verifySession()` in every protected page. Never add DB or fetch calls here.

## Step 24 — App sidebar (`components/app-sidebar.tsx`)

Default `navItems`:

```ts
const navItems = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Todos", href: "/dashboard/todos", icon: CheckSquare }, // demo — delete when done
  { title: "Settings", href: "/dashboard/settings", icon: Settings },
];
```

The footer contains the **theme toggle** (light → dark → system cycle) and the user avatar/name.

> Default theme is **system**. The toggle lives only in the sidebar footer — not on the settings page.

## Step 25 — Pages

Four pages. Every one shows only real data — no placeholder stats, no fake charts, no lorem sections.

**Home (`app/page.tsx`)** — a minimal landing page with a session-aware CTA. Not a redirect; an actual shippable
page. Server Component reading the session via `auth.api.getSession({ headers: await headers() })`. Renders
`APP_NAME` as the `<h1>`, a one-line tagline (replace per project), and one CTA link — `/dashboard` ("Go to
Dashboard") when signed in, `/sign-in` ("Get Started") otherwise — styled with `buttonVariants({ size: "lg" })` on
a `<Link>`. No nav bar, no features section, no footer.

**Sign-in (`app/sign-in/page.tsx`)** — two methods only:

- **Google OAuth** — `signIn.social({ provider: "google", callbackURL: "/dashboard" })`
- **Magic link** — `authClient.signIn.magicLink({ email, callbackURL: "/dashboard" })`

Email+password is **not** included. Do not add `emailAndPassword: { enabled: true }` to the auth config.

> Configure the OAuth client in [Google Cloud Console](https://console.cloud.google.com) → Credentials → OAuth 2.0
> Client IDs, with `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI.

**Dashboard overview (`app/dashboard/page.tsx`)** — two cards: a welcome card with the user's name and email from
the session, and a subscription card with the plan badge and billing control described below.

**Settings (`app/dashboard/settings/page.tsx`)** — two sections: **Account** (name and email, read-only, from
`verifySession()`) and **Billing**. No password change (no password in this stack), and no danger zone by default —
add account deletion per project.

Both the dashboard card and the settings Billing section render the same control: a "Free" or "Pro" plan badge,
plus an "Upgrade to Pro" checkout button (`authClient.subscription.upgrade`) when not subscribed, or a "Manage
subscription" billing-portal link (`authClient.subscription.billingPortal()`) when subscribed.

## Step 26 — Todos feature (initial example)

A todos CRUD that scaffolds the first feature and exercises every convention in the stack. Implement it as a full
FSD slice; the exact component
breakdown is up to you as long as it demonstrates:

- **List** — Server Component fetching via `data.ts` queries, scoped to the current user
- **Create** — `authActionClient` action + react-hook-form form (`useAction`)
- **Toggle complete** — `useOptimisticAction` for instant feedback, ownership-checked in the action
- **Bulk delete** (e.g. "delete completed") — a second mutation to show the pattern twice
- **Attachment** — presigned S3 upload + download via actions (Step 29)
- **Error convention** — validation errors inline, server errors as toast (Step 20)

**`features/todos/schemas.ts`** — shared between actions and forms:

```ts
import { z } from "zod";

export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
export const attachmentContentTypes = ["image/jpeg", "image/png", "application/pdf"] as const;

export const createTodoSchema = z.object({
  text: z.string().min(1).max(500),
  attachmentKey: z.string().optional(),
});

export const getUploadUrlSchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.enum(attachmentContentTypes),
  size: z.number().int().positive().max(MAX_ATTACHMENT_BYTES),
});

export const toggleTodoSchema = z.object({
  id: z.string(),
});
```

**Upload flow (four steps):**

1. Client calls a `getUploadUrl` action with the file's name, content type, and byte size. The action validates all
   three, **derives the key itself**, and returns it with a presigned `PutObject` URL and the headers to send.
2. Client uploads the `File` directly with `fetch(url, { method: "PUT", headers, body: file })`. It must send the
   exact signed `Content-Type` and `Content-Disposition`; the browser supplies `Content-Length` from the `File`.
3. Client calls `createTodo` with the returned key as `attachmentKey`.
4. Before persisting the key, `createTodo` verifies the ownership prefix and calls `HeadObject`. It accepts the
   object only when its stored `ContentLength` is within the limit and its `ContentType` is allowed; otherwise it
   deletes the invalid object and rejects the action.

**The client never dictates the key.** It proposes a filename; the action sanitizes it and namespaces it under the
caller's user id:

```ts
// features/todos/actions.ts — inside getUploadUrl, an authActionClient action
const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-100);
const key = `${ctx.user.id}/${createId()}/${safeName}`;
const contentDisposition = `attachment; filename="${safeName}"`;

const url = await getPresignedUploadUrl({
  key,
  contentType,
  contentLength: size,
  contentDisposition,
});

return {
  key,
  url,
  headers: {
    "Content-Type": contentType,
    "Content-Disposition": contentDisposition,
  },
};
```

A presigned PUT authorizes writing **one exact key**, so a client that could choose the key could request a URL for
`<someone-else's-id>/...` and overwrite their attachment. The `ctx.user.id` prefix makes that impossible by
construction; `createId()` stops a user overwriting their own files by uploading the same filename twice.

Create the `PutObjectCommand` with `Key`, `ContentType`, `ContentLength`, and `ContentDisposition`. Pass
`signableHeaders: new Set(["content-type", "content-length", "content-disposition"])` to `getSignedUrl` so the
request must match those values. The client cannot set `Content-Length` manually in browser `fetch`; its `File`
body causes the browser to supply the actual length. Keep the server-side `HeadObject` finalization check even when
these headers are signed: it is the portable enforcement point across S3-compatible providers and prevents an
invalid object from becoming application data. A PUT URL has no range condition, so an invalid upload may reach
object storage before the finalizer deletes it.

Two consequences to carry into real features:

- **Ownership checks read the prefix.** `getDownloadUrl` and any delete must verify the key starts with
  `${ctx.user.id}/` before signing. `createTodo` performs the same check and validates `HeadObject` metadata before
  accepting `attachmentKey`; otherwise the same hole reopens when the key is persisted.
- **`deleteTodo` deletes the object.** Call `deleteFile(todo.attachmentKey)` after the row is gone, or the bucket
  accumulates unreachable objects forever. Bulk-delete paths must collect and delete their attachments too.
- **Uploads can be abandoned before `createTodo`.** For production features where orphan volume matters, stage new
  objects under a `pending/` prefix or tag, promote/retag them after the DB write, and configure a bucket lifecycle
  rule that expires only stale pending objects. S3 lifecycle rules cannot infer whether an arbitrary object is
  referenced by the database.

Downloads work the same way in reverse: an action verifies ownership, then returns a presigned download URL via
`getPresignedDownloadUrl()`.

## Step 27 — getBaseUrl utility (`lib/utils.ts`)

```ts
export function getBaseUrl() {
  if (typeof window !== "undefined") return window.location.origin;
  if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
  return `http://localhost:${process.env.PORT ?? 3000}`;
}
```

> `BETTER_AUTH_URL` is already required and holds the full URL with protocol. Always set it in production.

## Step 28 — Email (`lib/email.ts`)

Sends through **Amazon SES** (`@aws-sdk/client-sesv2`) using the SES-only credentials. There is no SMTP or
nodemailer path in this stack.

- A module-level `SESv2Client` configured with `region: env.SES_REGION` and an explicit `credentials` object built
  from `env.SES_ACCESS_KEY_ID` / `env.SES_SECRET_ACCESS_KEY`.
- One exported function — the contract the auth config depends on:
  `sendEmail({ to, subject, react }: { to: string; subject: string; react: ReactElement })`. It awaits
  `render(react)` (react-email v6's `render` is async) and sends a `SendEmailCommand` with
  `FromEmailAddress: env.EMAIL_FROM`.

**`emails/magic-link.tsx`** — a `MagicLinkEmail({ url })` component: preview + heading "Sign in to {APP_NAME}", a
sentence noting the link expires shortly, a sign-in `<Button href={url}>`, the raw URL as copyable text, and an
"if you didn't request this, ignore it" line. Built entirely from react-email components. Do not hardcode a
duration in the copy; the plugin intentionally uses Better Auth's default `expiresIn`.

Preview templates with `pnpm email:dev` — no SES account needed for template work.

> react-email v6 ships as a single unified package: import `render` and all components from `"react-email"`. Do
> **not** install `@react-email/components` or `@react-email/render` — deprecated.

**Deliverability checklist (manual, once per domain).** Magic link _is_ the auth method here: an email in the spam
folder is a user who cannot sign in. Terraform provisions none of this — do it by hand before launch.

1. **Verify the domain** in the SES console (not just the single `EMAIL_FROM` address).
2. **Enable Easy DKIM** and publish the three `CNAME` records SES gives you. Wait for _Verified_.
3. **Choose the MAIL FROM setup deliberately.** SES's default `amazonses.com` MAIL FROM domain already passes SPF;
   do not add `include:amazonses.com` to the visible From domain just because SES sends the message. If you want SPF
   alignment with your domain, configure a **custom MAIL FROM subdomain** in SES (for example,
   `mail.<your-domain>`) and publish the exact MX and SPF records SES provides on that subdomain. If that
   subdomain already has an SPF record, merge the SES include into it; two SPF records on the same name is a hard
   fail, not a merge.
4. **Publish a DMARC record** — `TXT` at `_dmarc.<domain>`, starting at `v=DMARC1; p=none; rua=mailto:...`. Observe
   before you enforce, then tighten to `quarantine` once reports look clean.
5. **Request production access** to leave the sandbox — new SES accounts start in sandbox mode, where recipients
   must also be verified, and real users cannot sign in.

> DKIM is the one that matters — do not skip step 2.

## Step 29 — AWS S3 Object Storage (`lib/storage.ts`)

Thin wrappers around `@aws-sdk/client-s3` and `@aws-sdk/s3-request-presigner` against the private uploads bucket —
by default the AWS S3 bucket provisioned in `infra/` (Step 36), but any compatible S3 API can be configured.

- A module-level `S3Client` — constructing one makes no network calls and the credentials are always present.
  Config: `region: env.BUCKET_REGION`, an explicit `credentials` object from `env.BUCKET_ACCESS_KEY_ID` /
  `env.BUCKET_SECRET_ACCESS_KEY`, `endpoint: env.BUCKET_ENDPOINT` (undefined for AWS S3), and
  `forcePathStyle: env.BUCKET_FORCE_PATH_STYLE`.
- Exported functions, all passing `Bucket: env.BUCKET_NAME`: `uploadFile(key, body, contentType?)`,
  `downloadFile(key)`, `headFile(key)`, `deleteFile(key)`, `listFiles(prefix?)`,
  `getPresignedUploadUrl({ key, contentType, contentLength, contentDisposition, expiresIn = 300 })`, and
  `getPresignedDownloadUrl(key, expiresIn = 3600)`.
- `getPresignedUploadUrl` creates a `PutObjectCommand` with the exact key, MIME type, byte length, and content
  disposition, then calls `getSignedUrl` with all three headers in `signableHeaders`. Return only the URL; the
  action returns the exact upload headers alongside it.
- `headFile` sends `HeadObjectCommand` and returns `ContentLength`, `ContentType`, and `ContentDisposition` for the
  finalization check. Treat a missing value or mismatch as invalid and delete the object.
- **Never gated:** all four `BUCKET_*` vars are required and `BUCKET_NAME` has no default, so storage is always
  available.

Keep the bucket **private** (block public access) and serve files through presigned URLs or an authenticated
backend route.

> To swap AWS S3 for another provider, set `BUCKET_ENDPOINT` and `BUCKET_FORCE_PATH_STYLE=true` if it addresses
> buckets by path. Confirm that the provider preserves signed PUT headers and supports `HeadObject`; the finalization
> check remains mandatory. When the uploads bucket moves away from AWS, the uploads resources in `infra/` become
> unnecessary, but keep the app user's SES policy and the backups bucket (Step 36).

## Step 30 — `app/api/health/route.ts`

A `GET` that executes `SELECT 1` through the Drizzle client: `{ status: "ok" }` on success, `{ status: "error" }`
with a 503 if the query throws.

> Referenced by `railway.json` as the `healthcheckPath`.

## Step 31 — `app/api/cron/route.ts`

A stub `GET` endpoint for scheduled jobs, empty by default:

- Returns `401 { error: "Unauthorized" }` unless `env.CRON_SECRET` is set **and** the request carries
  `Authorization: Bearer <CRON_SECRET>` (unset secret = endpoint disabled, same optional-feature pattern as
  Stripe).
- Otherwise runs the scheduled work and returns `{ status: "ok" }`.

**Wiring the scheduler.** The endpoint is inert until something calls it. Add a Railway **cron service** — the same
shape as the backup container (Step 37):

- A service in the same project, `restartPolicyType: "NEVER"` (run and exit), with a `cronSchedule`.
- Its only job is one authenticated request:

  ```bash
  curl -fsS -X GET "$APP_URL/api/cron" -H "Authorization: Bearer $CRON_SECRET"
  ```

- Variables: `APP_URL` (reference the app service's domain) and `CRON_SECRET` — the **same value** the app has, or
  every call 401s.

> `-f` matters: without it `curl` exits 0 on a 500 and a failed job reads as a success in Railway's logs.
> Keep `CRON_SECRET` blank until you actually have scheduled work — the endpoint stays disabled and 401s everyone.

## Step 32 — package.json Scripts

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

Also pin the package manager in the same file — `corepack enable && corepack use pnpm@latest` writes it:

```json
{ "packageManager": "pnpm@10.0.0" }
```

> `db:seed` is empty by default. `postlint` runs `tsc --noEmit` automatically after every lint run.
> `packageManager` pins the exact pnpm version Corepack enforces locally; CI pins the major separately
> (`version: 11`, Step 35) and the action cross-checks the two, so bump them together.
> `stripe:dev` requires `stripe login` once. Railpack handles the production build and container startup — no
> Railway-specific build/start scripts.

## Step 33 — `scripts/test.ts` (smoke test)

Verifies the environment is wired correctly after cloning. Run with `pnpm test` (tsx loads `.env` via
`--env-file`). Sequential checks, exiting non-zero on the first failure:

1. **Database** — execute `SELECT 1` through the Drizzle client.
2. **Storage** — dynamic-import `listFiles()` from `lib/storage.ts` and call it.
3. **Stripe** (optional) — if `env.STRIPE_SECRET_KEY` is set, confirm its presence.

Each passing check logs a `✓` line; the script ends with "All checks passed." and `process.exit(0)`.

> **There is no test suite, and this is deliberate** — no Vitest, no Playwright, no test job in CI. Do not add a
> test framework to the starter kit itself. Add one per project.

## Step 34 — Format and Verify

```bash
pnpm format
pnpm lint
```

`pnpm lint` runs in sequence: `eslint` (including Prettier as a lint rule) → `tsc --noEmit`. Use
`pnpm format:check` to verify Prettier separately.

## Step 35 — GitHub Actions CI (`.github/workflows/ci.yml`)

One `checks` job on both `push` and `pull_request`, with `permissions: { contents: read }`, seven steps:

1. `actions/checkout@v7`
2. `cp .env.example .env` — the committed placeholders are the CI environment. Do **not** define job-level `env:`
   placeholders; `.env.example` is the single source (Step 6).
3. `pnpm/action-setup@v6` with `version: 11` — pin the major explicitly instead of reading `packageManager`.
   The action still cross-checks the range against `packageManager`, so a major bump must update both.
4. `actions/setup-node@v6` with `node-version: 24` and `cache: pnpm` (pnpm must be set up first for the cache).
5. `pnpm install --frozen-lockfile` — CI fails on lockfile drift instead of silently updating it.
6. `pnpm lint`.
7. `pnpm build`.

> No separate `pnpm format:check` step: `pnpm lint` already covers ESLint + Prettier-as-a-lint-rule + `tsc --noEmit`.
> **`node-version: 24` pins CI only, and is not authoritative.** There is deliberately no `engines` field and no
> `.nvmrc`; add `engines` per project if the drift ever bites.
> `next build` validates the production compilation path before merge; Next.js loads `.env` at build time, which is
> why the copied placeholders satisfy `lib/env.ts` while modules are compiled. Stripe and cron variables stay blank
> (= unset). The build must not contact Postgres, SES, or S3.
> Keep `actions/checkout@v7`; it is the current action generation used by this guide.

## Step 36 — AWS Infrastructure (`infra/`, Terraform)

Terraform in `infra/` provisions everything a project needs on AWS, using the latest `terraform-aws-modules`
(`s3-bucket` ~> 5.0; `iam` ~> 6.0 for both the `iam-user` and `iam-policy` submodules — no raw `aws_iam_policy`
resources). **No workspaces** — one root configuration; each environment is a file pair in `build/`:

```
infra/
  main.tf / variables.tf / outputs.tf   ← backend, provider, one module "stack" call
  build/
    dev.tfvars  + dev.s3.tfbackend      ← dev values (resources prefixed <project>-dev) + dev state key
    prod.tfvars + prod.s3.tfbackend     ← prod values (prefixed <project>) + prod state key
  modules/
    stack/                              ← app resources: uploads bucket, app user + policies
    backups/                            ← backups bucket + upload-only user (instantiated only in prod)
```

The backend-config file holds that environment's state `key`, which is what keeps the two environments in
separate state files — never apply one environment's tfvars against the other's state.

**Layout & conventions**:

- S3 backend (`nimbusit-terraform-state`, `use_lockfile`) with **no `key` in the backend block** — the key comes
  from `terraform init -backend-config=build/<env>.s3.tfbackend`; change it per project in both files. The bucket
  name is **intentionally org-specific**: an existing bucket in this AWS account, created once and shared by every
  project. Forking this kit into another org means pointing the backend at your own state bucket.
- Single AWS provider in `us-east-1` with `default_tags` of `Project` + `Environment`.
- Variables: `environment` (the root validates `dev` | `prod`), `project_name` (root-validated slug),
  `ses_from_email`, and `bucket_allowed_origins`. `ses_from_email` is the full From address the app sends as
  (e.g. `no-reply@example.com`) — SES sending is scoped to exactly this address. `bucket_allowed_origins` is a non-empty
  list of complete origins with no trailing slash used only for S3 CORS — **always set explicitly per
  environment**: `["http://localhost:3000"]` in dev, the real `https://` origins (for example,
  `https://app.example.com` or a Railway-generated origin) in prod. No environment conditional picks origins; the
  tfvars are the single source. Never derive the app origin by prepending `www`. The two `build/*.tfvars` files
  hold per-project values — edit after cloning.
- The root derives `local.prefix` (`<project>` in prod, `<project>-dev` otherwise) and passes **only `prefix`** to
  the modules — neither module receives `environment` or `project_name`; the modules validate their own inputs
  (`ses_from_email`, `bucket_allowed_origins`).

**Application resources** (`modules/stack`):

- **Uploads bucket** (`<prefix>-uploads`, s3-bucket module): private, with `attach_require_latest_tls_policy` +
  `attach_deny_insecure_transport_policy`, and a CORS rule allowing `GET`/`PUT` with `Content-Type` and
  `Content-Disposition` from every value in `bucket_allowed_origins` — required for the browser's direct presigned
  PUT/download flow.
- **App user** (`<prefix>-app`, iam-user module, no login profile) — a **single IAM user** carrying both app
  policies via the iam-policy module (documents authored as `data.aws_iam_policy_document`):
  - `<prefix>-storage-s3-access` with two statements: `s3:ListBucket` + `s3:GetBucketLocation` on the bucket ARN,
    and `s3:GetObject` + `s3:PutObject` + `s3:DeleteObject` on the bucket's object ARN (`/*`). Do not grant `s3:*`
    or bucket-administration actions.
  - `<prefix>-ses-send` — `ses:SendEmail` on `*`, conditioned (`StringEquals`) to `ses:FromAddress` being exactly
    `<ses_from_email>`. The app does not send raw email, so it does not need `ses:SendRawEmail`.

  Its key pair fills both the `SES_*` and `BUCKET_*` env pairs (Step 6).

**Backup resources** (`modules/backups` — a separate module; the root instantiates it with
`count = var.environment == "prod" ? 1 : 0`, so no per-resource conditionals inside):

- **Backups bucket** (`<prefix>-database-backups`): unversioned, AES256 server-side encryption, TLS policies as
  above, and a lifecycle rule expiring objects after 30 days. Each backup is a uniquely named object, so this is
  the retention mechanism; the backup container never deletes.
- **Backup user** (`<prefix>-database-backup`, no login profile) with a single policy allowing only `s3:PutObject`
  on the backups bucket's objects.

**Outputs**: `aws_region`, `bucket_id`, app user `app_access_key_id` / `app_secret_access_key` (sensitive),
`ses_from_email` (echoes the input), and the production-only `backups_bucket_id` /
`backup_user_access_key_id` / `backup_user_access_key_secret` (null in dev).

Add to `.gitignore`: `**/.terraform/`, `*.tfstate*`, `.env.infra` — and **commit** `infra/.terraform.lock.hcl`
plus the `build/` tfvars and tfbackend files (they hold no secrets).

**`infra/README.md`** documents the apply flow, explains that each production app origin must be listed exactly in
`bucket_allowed_origins`, and includes a quick script (`write-env.sh`) that writes the app outputs to
`../.env.infra` for copying into `.env`.

> Apply per environment:
> `terraform init -backend-config=build/dev.s3.tfbackend && terraform apply -var-file=build/dev.tfvars` for dev;
> same with the `prod` pair (plus `init -reconfigure`) for production. Switching environments in the same checkout
> always requires `init -reconfigure` — the state file is fixed at init time. SES **verification** is not
> provisioned — verify the domain in the SES console (Step 28).

## Step 37 — Database backup service (`backup/`)

A minimal Railway cron container: dump the database, upload to S3, exit. Retention is the backups bucket's
lifecycle rule (Step 36) — the container only ever uploads, never lists or deletes.

- **`Dockerfile`** — `FROM postgres:18` (pg_dump must match the server's major version — the same tag as
  `compose.yaml`, Step 8) plus `apt-get install awscli`; copies in `backup.sh` as the entrypoint.
- **`backup.sh`** (`#!/bin/bash` + `set -euo pipefail`; requires `DATABASE_URL` and `BACKUP_BUCKET`): create a temp
  file with `mktemp`, register an `EXIT` trap to remove it, then run
  `pg_dump --format=custom --no-owner --no-privileges --file="$dump_file" "$DATABASE_URL"`. Validate the archive
  with `pg_restore --list "$dump_file" >/dev/null`, then `aws s3 cp` it to
  `s3://$BACKUP_BUCKET/db/YYYY/MM/DD/<ISO-timestamp>.dump`.
- **`railway.json`** — `DOCKERFILE` builder with `watchPatterns: ["backup/**"]`, `cronSchedule: "0 6 * * *"`
  (daily 06:00 UTC), `restartPolicyType: "NEVER"`.

Deploy as a second Railway service with root directory `backup/`, connected to the same repo. Set its variables
from the production Terraform outputs: `DATABASE_URL` (reference the Postgres service — private network),
`BACKUP_BUCKET`, `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` (the **backup** user — not the storage or SES
user), and `AWS_REGION`.

> The `AWS_*` names are correct **here only** — this container shells out to `aws-cli`. The app never uses them
> (Step 7).
> Custom format (`-Fc`) is compressed by `pg_dump` by default and supports selective restores through `pg_restore`;
> do not pipe it through `gzip` again. `set -o pipefail` remains enabled so any future pipeline fails when any stage
> fails. The archive validation replaces the arbitrary 100-byte heuristic.
> A backup is not proven until it restores. Run a scheduled restore drill into a disposable PostgreSQL database and
> execute at least `SELECT 1` plus project-specific row-count/invariant checks before destroying the test database.

## Step 38 — Deployment on Railway

Railpack auto-detects Next.js and handles the production build and startup. `railway.json` stays minimal:

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
3. Generate a public app domain (Railway-generated or custom), then set `BETTER_AUTH_URL` to that exact origin.
4. Put the same origin in the `bucket_allowed_origins` list in `infra/build/prod.tfvars` and re-apply the production
   environment so S3 CORS accepts browser uploads. Add every additional production origin explicitly; no `www`
   hostname is assumed.
5. Configure Google OAuth with `<BETTER_AUTH_URL>/api/auth/callback/google`.

**Required app service variables:** `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`,
`GOOGLE_CLIENT_SECRET`, `EMAIL_FROM`, `SES_REGION`, `SES_ACCESS_KEY_ID`, `SES_SECRET_ACCESS_KEY`, `BUCKET_REGION`,
`BUCKET_ACCESS_KEY_ID`, `BUCKET_SECRET_ACCESS_KEY`, `BUCKET_NAME`.

**Optional:** `CRON_SECRET`; the Stripe trio `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `STRIPE_PRICE_ID`
(leave all three blank to disable billing, or set all three); plus `BUCKET_ENDPOINT` / `BUCKET_FORCE_PATH_STYLE` for
non-AWS S3-compatible hosts.

The `SES_*` and `BUCKET_*` pairs both hold the app user's key pair from the Terraform outputs in Step 36. If you'd
rather use a Railway bucket than AWS S3,
confirm that its current S3 API supports signed PUT headers and `HeadObject`, then take its credentials from the
bucket service and set `BUCKET_ENDPOINT` (plus `BUCKET_FORCE_PATH_STYLE=true`) alongside them. For local
development, link the project with the Railway CLI and run commands through `railway run`, which injects the same
service variables locally.

> Migrations run as Railway's **pre-deploy command**, never `postbuild`.
> Also compatible with **Dokploy** and any other platform that supports Railpack.

---

## Step 39 — `AGENTS.md`

Create `AGENTS.md` at the repo root (replace the one `create-next-app` scaffolds, if any). It is built from a base
plus two project sections.

**Base — behavioral guidelines.** Copy the contents of
https://github.com/multica-ai/andrej-karpathy-skills/blob/main/CLAUDE.md (retitled to `AGENTS.md`): four rules for
LLM coding discipline — Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution.

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

Finally, create a `CLAUDE.md` at the repo root whose entire content is one import line, so Claude Code loads the
same instructions:

```md
@AGENTS.md
```

## Step 40 — AI Configuration (Skills)

Install first-party knowledge packs so the AI knows each library's conventions:

```bash
pnpm dlx skills add shadcn/ui
pnpm dlx skills add better-auth/skills
pnpm dlx skills add next-safe-action/skills
```

| Skill                | What it teaches                                                                                                  |
| -------------------- | ---------------------------------------------------------------------------------------------------------------- |
| **shadcn/ui**        | Component patterns, `buttonVariants`, theming, registry authoring. Auto-activates when `components.json` exists. |
| **better-auth**      | Library conventions, safe patterns, plugin setup (6 packs: best-practices, security, email/password, org, 2FA)   |
| **next-safe-action** | Client creation, middleware, hooks, forms, error handling, better-auth + TanStack Query integrations (9 packs)   |

> Run the installs from the **repo root**. Skills install into `.agents/`, and the installer creates `.claude/`
> with symlinks into `.agents/skills/` so Claude Code auto-discovers them. Both `.agents/` and `.claude/` are
> gitignored — run the installs once per project instead of committing the packs, then restart Claude Code.

---

## Key Gotchas

Traps that aren't obvious from the step they belong to. Everything else is documented inline above.

1. **shadcn v4 + @base-ui/react has no `asChild`.** For links styled as buttons, use `buttonVariants()`:

   ```tsx
   <Link href="/dashboard/todos" className={cn(buttonVariants())}>
     Go
   </Link>
   ```

   For `SidebarMenuButton` (which uses base-ui's `useRender`), pass `render={<Link href="..." />}` instead. It also
   accepts `isActive` and `tooltip` props.

2. **Tailwind v4 config lives in `globals.css`** via `@import "tailwindcss"`, not `tailwind.config.js`.

3. **Zod v4 — `z.url()` and `z.email()` are top-level types.** `z.string().url()` / `.email()` are deprecated.

4. **`next-themes` must be installed explicitly.** Do not rely on it being pulled in transitively by shadcn.

5. **`shadcn` and `auth` are CLI packages, not dead weight.** `shadcn` (prod dep) provides the pinned `pnpm shadcn`
   binary; `auth` (dev dep) provides the `better-auth` binary for `auth:generate`. Do not remove them as "unused".

6. **One subscription per user — the Stripe plugin does _not_ enforce this.** `subscription.upgrade` without a
   `subscriptionId` creates a _second_ subscription alongside the existing one, and the user is billed twice. Never
   call `upgrade` for an already-subscribed user: the UI must only offer Upgrade when not subscribed, and the
   billing portal otherwise. `getSubscription` prefers the active/trialing row if duplicates ever appear.

7. **`useOptimisticAction` is for pure mutations.** Use it for toggle (instant feedback), and plain `useAction` for
   create — anything with async side effects like a file upload must not be optimistic.

8. **The todos feature is the initial FSD example.** Adapt or replace it when the first product feature is defined.
