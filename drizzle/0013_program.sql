CREATE TYPE "public"."practice_daypart" AS ENUM('morning', 'evening');--> statement-breakpoint
CREATE TYPE "public"."practice_frequency" AS ENUM('daily', 'weekly');--> statement-breakpoint
CREATE TABLE "navigator_message" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"master_name" text NOT NULL,
	"position" smallint NOT NULL,
	"day7_task" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "navigator_message_type" (
	"message_id" uuid NOT NULL,
	"type_id" text NOT NULL,
	CONSTRAINT "navigator_message_type_message_id_type_id_pk" PRIMARY KEY("message_id","type_id")
);
--> statement-breakpoint
CREATE TABLE "navigator_part" (
	"message_id" uuid NOT NULL,
	"part" smallint NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"first_day_task" text,
	"second_day_task" text,
	CONSTRAINT "navigator_part_message_id_part_pk" PRIMARY KEY("message_id","part"),
	CONSTRAINT "navigator_part_number" CHECK ("navigator_part"."part" between 1 and 3)
);
--> statement-breakpoint
CREATE TABLE "navigator_read" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"message_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "navigator_read_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
CREATE TABLE "practice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"frequency" "practice_frequency" NOT NULL,
	"daypart" "practice_daypart",
	"position" smallint NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"audio_path" text,
	"video_url" text,
	"opens_on_day" smallint DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_daypart_only_daily" CHECK (("practice"."frequency" = 'daily') = ("practice"."daypart" is not null)),
	CONSTRAINT "practice_opens_on_day" CHECK ("practice"."opens_on_day" >= 1)
);
--> statement-breakpoint
CREATE TABLE "practice_mark" (
	"user_id" text NOT NULL,
	"practice_id" uuid NOT NULL,
	"day" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_mark_user_id_practice_id_day_pk" PRIMARY KEY("user_id","practice_id","day")
);
--> statement-breakpoint
CREATE TABLE "practice_note" (
	"user_id" text NOT NULL,
	"practice_id" uuid NOT NULL,
	"day" date NOT NULL,
	"text" text NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "practice_note_user_id_practice_id_day_pk" PRIMARY KEY("user_id","practice_id","day")
);
--> statement-breakpoint
CREATE TABLE "program_start" (
	"user_id" text PRIMARY KEY NOT NULL,
	"started_on" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "welcome_video_seen" (
	"user_id" text PRIMARY KEY NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "navigator_message_type" ADD CONSTRAINT "navigator_message_type_message_id_navigator_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."navigator_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigator_part" ADD CONSTRAINT "navigator_part_message_id_navigator_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."navigator_message"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigator_read" ADD CONSTRAINT "navigator_read_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "navigator_read" ADD CONSTRAINT "navigator_read_message_id_navigator_message_id_fk" FOREIGN KEY ("message_id") REFERENCES "public"."navigator_message"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_mark" ADD CONSTRAINT "practice_mark_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_mark" ADD CONSTRAINT "practice_mark_practice_id_practice_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_note" ADD CONSTRAINT "practice_note_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_note" ADD CONSTRAINT "practice_note_practice_id_practice_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "program_start" ADD CONSTRAINT "program_start_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "welcome_video_seen" ADD CONSTRAINT "welcome_video_seen_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_mark_user_day_idx" ON "practice_mark" USING btree ("user_id","day");