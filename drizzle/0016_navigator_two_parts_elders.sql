CREATE TABLE "elder_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"position" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elder_message_type" (
	"message_id" uuid NOT NULL,
	"type_id" text NOT NULL,
	CONSTRAINT "elder_message_type_message_id_type_id_pk" PRIMARY KEY("message_id","type_id")
);
--> statement-breakpoint
ALTER TABLE "navigator_part" DROP CONSTRAINT "navigator_part_number";--> statement-breakpoint
ALTER TABLE "navigator_message" ADD COLUMN "day5_task" text;--> statement-breakpoint
ALTER TABLE "elder_message_type" ADD CONSTRAINT "elder_message_type_message_id_elder_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."elder_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigator_message" DROP COLUMN "day7_task";--> statement-breakpoint
ALTER TABLE "navigator_part" ADD CONSTRAINT "navigator_part_number" CHECK ("navigator_part"."part" between 1 and 2);