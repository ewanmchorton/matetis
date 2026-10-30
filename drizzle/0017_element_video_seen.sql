CREATE TABLE "element_video_seen" (
	"user_id" text NOT NULL,
	"element" text NOT NULL,
	"season_year" smallint NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "element_video_seen_user_id_element_season_year_pk" PRIMARY KEY("user_id","element","season_year")
);
--> statement-breakpoint
ALTER TABLE "element_video_seen" ADD CONSTRAINT "element_video_seen_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;