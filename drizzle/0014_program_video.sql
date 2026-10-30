CREATE TABLE "program_video" (
	"slot" text PRIMARY KEY NOT NULL,
	"video_url" text,
	"body" text DEFAULT '' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "program_video_slot" CHECK ("program_video"."slot" in ('welcome', 'wood', 'fire', 'earth', 'metal', 'water'))
);
