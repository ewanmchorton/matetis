CREATE TABLE "daily_phrase" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "daily_phrase_delivery" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"send_at" timestamp with time zone NOT NULL,
	"phrase_id" uuid,
	"sent_at" timestamp with time zone,
	CONSTRAINT "daily_phrase_delivery_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "daily_phrase_type" (
	"phrase_id" uuid NOT NULL,
	"type_id" text NOT NULL,
	CONSTRAINT "daily_phrase_type_phrase_id_type_id_pk" PRIMARY KEY("phrase_id","type_id")
);
--> statement-breakpoint
ALTER TABLE "person_settings" ADD COLUMN "phrase_notifications" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "person_settings" ADD COLUMN "phrase_from_hour" smallint DEFAULT 9 NOT NULL;--> statement-breakpoint
ALTER TABLE "person_settings" ADD COLUMN "phrase_to_hour" smallint DEFAULT 21 NOT NULL;--> statement-breakpoint
ALTER TABLE "person_settings" ADD COLUMN "time_zone" text;--> statement-breakpoint
ALTER TABLE "daily_phrase_delivery" ADD CONSTRAINT "daily_phrase_delivery_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_phrase_delivery" ADD CONSTRAINT "daily_phrase_delivery_phrase_id_daily_phrase_id_fk" FOREIGN KEY ("phrase_id") REFERENCES "public"."daily_phrase"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "daily_phrase_type" ADD CONSTRAINT "daily_phrase_type_phrase_id_daily_phrase_id_fk" FOREIGN KEY ("phrase_id") REFERENCES "public"."daily_phrase"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "daily_phrase_delivery_send_idx" ON "daily_phrase_delivery" USING btree ("send_at");--> statement-breakpoint
ALTER TABLE "person_settings" ADD CONSTRAINT "person_settings_phrase_hours" CHECK ("person_settings"."phrase_from_hour" >= 0 and "person_settings"."phrase_to_hour" <= 24 and "person_settings"."phrase_from_hour" < "person_settings"."phrase_to_hour");