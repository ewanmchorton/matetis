DROP INDEX "access_period_email_ends_idx";--> statement-breakpoint
ALTER TABLE "access_expiry_reminder" DROP CONSTRAINT "access_expiry_reminder_email_access_until_pk";--> statement-breakpoint
ALTER TABLE "access_period" ALTER COLUMN "contact" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "access_expiry_reminder" ALTER COLUMN "contact" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "access_expiry_reminder" ADD CONSTRAINT "access_expiry_reminder_contact_access_until_pk" PRIMARY KEY("contact","access_until");--> statement-breakpoint
CREATE INDEX "access_period_contact_ends_idx" ON "access_period" USING btree ("contact","ends_at");--> statement-breakpoint
ALTER TABLE "access_period" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "access_expiry_reminder" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "access_period" ADD CONSTRAINT "access_period_contact_format" CHECK ("access_period"."contact" ~ '^(@[a-z0-9_]{5,32}|tg:[0-9]+|[^@\s]+@[^@\s]+\.[^@\s]+)$');