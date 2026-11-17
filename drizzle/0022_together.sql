CREATE TYPE "public"."feed_event_kind" AS ENUM('first_practice', 'joint_completed', 'comeback');--> statement-breakpoint
CREATE TYPE "public"."joint_practice_source" AS ENUM('invite', 'monthly');--> statement-breakpoint
CREATE TYPE "public"."joint_practice_status" AS ENUM('pending', 'active', 'completed', 'declined', 'cancelled', 'stopped', 'expired');--> statement-breakpoint
CREATE TABLE "feed_event" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"kind" "feed_event_kind" NOT NULL,
	"joint_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_event_joint_only_completed" CHECK (("feed_event"."kind" = 'joint_completed') = ("feed_event"."joint_id" is not null))
);
--> statement-breakpoint
CREATE TABLE "feed_reaction" (
	"event_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feed_reaction_event_id_user_id_pk" PRIMARY KEY("event_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "joint_practice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" uuid NOT NULL,
	"source" "joint_practice_source" NOT NULL,
	"invited_by" text,
	"status" "joint_practice_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"starts_on" date,
	"ends_on" date,
	"closed_at" timestamp with time zone,
	CONSTRAINT "joint_practice_invite_has_author" CHECK (("joint_practice"."source" = 'invite') = ("joint_practice"."invited_by" is not null)),
	CONSTRAINT "joint_practice_period_when_started" CHECK ("joint_practice"."status" not in ('active', 'completed') or ("joint_practice"."starts_on" is not null and "joint_practice"."ends_on" is not null))
);
--> statement-breakpoint
CREATE TABLE "joint_practice_member" (
	"joint_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"accepted_at" timestamp with time zone,
	"open" boolean DEFAULT true NOT NULL,
	"dismissed_at" timestamp with time zone,
	CONSTRAINT "joint_practice_member_joint_id_user_id_pk" PRIMARY KEY("joint_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "monthly_match" (
	"user_id" text NOT NULL,
	"month" date NOT NULL,
	"joint_id" uuid NOT NULL,
	CONSTRAINT "monthly_match_user_id_month_pk" PRIMARY KEY("user_id","month"),
	CONSTRAINT "monthly_match_first_day" CHECK (extract(day from "monthly_match"."month") = 1)
);
--> statement-breakpoint
ALTER TABLE "practice" ADD COLUMN "allow_together" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "feed_event" ADD CONSTRAINT "feed_event_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_event" ADD CONSTRAINT "feed_event_joint_id_joint_practice_id_fk" FOREIGN KEY ("joint_id") REFERENCES "public"."joint_practice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_reaction" ADD CONSTRAINT "feed_reaction_event_id_feed_event_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."feed_event"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feed_reaction" ADD CONSTRAINT "feed_reaction_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joint_practice" ADD CONSTRAINT "joint_practice_practice_id_practice_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joint_practice" ADD CONSTRAINT "joint_practice_invited_by_user_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joint_practice_member" ADD CONSTRAINT "joint_practice_member_joint_id_joint_practice_id_fk" FOREIGN KEY ("joint_id") REFERENCES "public"."joint_practice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "joint_practice_member" ADD CONSTRAINT "joint_practice_member_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_match" ADD CONSTRAINT "monthly_match_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "monthly_match" ADD CONSTRAINT "monthly_match_joint_id_joint_practice_id_fk" FOREIGN KEY ("joint_id") REFERENCES "public"."joint_practice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "feed_event_one_first" ON "feed_event" USING btree ("user_id") WHERE "feed_event"."kind" = 'first_practice';--> statement-breakpoint
CREATE UNIQUE INDEX "feed_event_one_per_joint" ON "feed_event" USING btree ("user_id","joint_id");--> statement-breakpoint
CREATE INDEX "feed_event_user_created_idx" ON "feed_event" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "joint_practice_member_one_open" ON "joint_practice_member" USING btree ("user_id") WHERE "joint_practice_member"."open";