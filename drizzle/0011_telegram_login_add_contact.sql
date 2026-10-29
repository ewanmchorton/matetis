ALTER TABLE "access_period" DROP CONSTRAINT "access_period_email_normalized";--> statement-breakpoint
ALTER TABLE "access_period" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ALTER COLUMN "email" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "access_period" ADD COLUMN "contact" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "telegram_id" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "telegram_username" text;--> statement-breakpoint
ALTER TABLE "access_expiry_reminder" ADD COLUMN "contact" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_telegram_id_unique" UNIQUE("telegram_id");--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_has_login" CHECK ("user"."email" is not null or "user"."telegram_id" is not null);--> statement-breakpoint
-- Доступы и напоминания, записанные по почте, переносятся в «контакт» без изменений.
UPDATE "access_period" SET "contact" = "email";--> statement-breakpoint
UPDATE "access_expiry_reminder" SET "contact" = "email";
