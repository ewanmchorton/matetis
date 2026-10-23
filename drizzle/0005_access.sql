CREATE TYPE "public"."access_payment_method" AS ENUM('manual');--> statement-breakpoint
ALTER TYPE "public"."person_role" ADD VALUE 'content_manager' BEFORE 'admin';--> statement-breakpoint
CREATE TABLE "access_period" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'EUR' NOT NULL,
	"method" "access_payment_method" DEFAULT 'manual' NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_period_email_normalized" CHECK ("access_period"."email" = lower(btrim("access_period"."email")) and "access_period"."email" <> ''),
	CONSTRAINT "access_period_dates" CHECK ("access_period"."ends_at" >= "access_period"."starts_at"),
	CONSTRAINT "access_period_amount" CHECK ("access_period"."amount_cents" >= 0)
);
--> statement-breakpoint
CREATE TABLE "access_settings" (
	"id" boolean PRIMARY KEY DEFAULT true NOT NULL,
	"admin_phone" text NOT NULL,
	"first_month_cents" integer NOT NULL,
	"month_cents" integer NOT NULL,
	"three_months_cents" integer NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_settings_single_row" CHECK ("access_settings"."id"),
	CONSTRAINT "access_settings_prices" CHECK ("access_settings"."first_month_cents" >= 0 and "access_settings"."month_cents" >= 0 and "access_settings"."three_months_cents" >= 0)
);
--> statement-breakpoint
ALTER TABLE "access_period" ADD CONSTRAINT "access_period_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_period_email_ends_idx" ON "access_period" USING btree ("email","ends_at");--> statement-breakpoint
-- Начальные настройки доступа: телефон Татьяны Валерьевны и цены, согласованные с Жанной 23.10.2026.
INSERT INTO "access_settings" ("admin_phone", "first_month_cents", "month_cents", "three_months_cents") VALUES ('+375293344101', 2000, 500, 1000);
