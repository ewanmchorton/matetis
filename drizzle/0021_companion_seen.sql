CREATE TABLE "companion_seen" (
	"user_id" text NOT NULL,
	"element" text NOT NULL,
	"season_year" smallint NOT NULL,
	"stage" smallint NOT NULL,
	"seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companion_seen_user_id_element_season_year_pk" PRIMARY KEY("user_id","element","season_year"),
	CONSTRAINT "companion_seen_stage" CHECK ("companion_seen"."stage" between 1 and 6)
);
--> statement-breakpoint
ALTER TABLE "companion_seen" ADD CONSTRAINT "companion_seen_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;