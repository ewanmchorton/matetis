CREATE TABLE "access_expiry_reminder" (
	"email" text NOT NULL,
	"access_until" timestamp with time zone NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "access_expiry_reminder_email_access_until_pk" PRIMARY KEY("email","access_until")
);
--> statement-breakpoint
CREATE TABLE "push_subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"endpoint" text NOT NULL,
	"p256dh" text NOT NULL,
	"auth" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "push_subscription_endpoint_unique" UNIQUE("endpoint")
);
--> statement-breakpoint
ALTER TABLE "push_subscription" ADD CONSTRAINT "push_subscription_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "access_expiry_reminder_sent_idx" ON "access_expiry_reminder" USING btree ("sent_at");--> statement-breakpoint
CREATE INDEX "push_subscription_user_idx" ON "push_subscription" USING btree ("user_id");