CREATE TYPE "public"."friend_request_status" AS ENUM('pending', 'accepted', 'declined');--> statement-breakpoint
CREATE TABLE "friend_request" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_user_id" text NOT NULL,
	"to_user_id" text NOT NULL,
	"status" "friend_request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone,
	CONSTRAINT "friend_request_not_self" CHECK ("friend_request"."from_user_id" <> "friend_request"."to_user_id")
);
--> statement-breakpoint
CREATE TABLE "person_settings" (
	"user_id" text PRIMARY KEY NOT NULL,
	"publish_events" boolean DEFAULT true NOT NULL,
	"auto_match_consent" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_from_user_id_user_id_fk" FOREIGN KEY ("from_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "friend_request" ADD CONSTRAINT "friend_request_to_user_id_user_id_fk" FOREIGN KEY ("to_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "person_settings" ADD CONSTRAINT "person_settings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "friend_request_pair_unique" ON "friend_request" USING btree (least("from_user_id", "to_user_id"),greatest("from_user_id", "to_user_id"));--> statement-breakpoint
CREATE INDEX "friend_request_to_user_idx" ON "friend_request" USING btree ("to_user_id");--> statement-breakpoint
CREATE INDEX "friend_request_from_user_idx" ON "friend_request" USING btree ("from_user_id");