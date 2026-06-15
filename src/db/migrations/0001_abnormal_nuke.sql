ALTER TABLE "accounts" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "email_verified" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "created_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "verifications" ALTER COLUMN "updated_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "polar_customer_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "polar_product_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "period_start" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "period_end" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at_period_end" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "cancel_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "ended_at" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "seats" integer;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_start" timestamp;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "trial_end" timestamp;--> statement-breakpoint
CREATE INDEX "accounts_userId_idx" ON "accounts" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_userId_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verifications_identifier_idx" ON "verifications" USING btree ("identifier");