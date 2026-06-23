ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_polar_subscription_id_unique";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP CONSTRAINT "subscriptions_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'incomplete';--> statement-breakpoint
ALTER TABLE "subscriptions" ALTER COLUMN "cancel_at_period_end" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "plan" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "reference_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "billing_interval" text;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD COLUMN "stripe_schedule_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
CREATE INDEX "subscriptions_referenceId_idx" ON "subscriptions" USING btree ("reference_id");--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "polar_subscription_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "polar_customer_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "polar_product_id";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "created_at";--> statement-breakpoint
ALTER TABLE "subscriptions" DROP COLUMN "updated_at";