ALTER TABLE "access_settings" ADD COLUMN "admin_telegram" text DEFAULT '' NOT NULL;--> statement-breakpoint
UPDATE "access_settings" SET "admin_telegram" = 'vernojit';
