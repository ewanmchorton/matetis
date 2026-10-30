CREATE TYPE "public"."practice_alternation" AS ENUM('first', 'second');--> statement-breakpoint
ALTER TYPE "public"."practice_frequency" ADD VALUE 'awareness';--> statement-breakpoint
CREATE TABLE "practice_variant" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"practice_id" uuid NOT NULL,
	"position" smallint NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"audio_path" text,
	"video_url" text,
	"weak_element" text,
	"season_element" text,
	CONSTRAINT "practice_variant_weak_element" CHECK ("practice_variant"."weak_element" in ('wood', 'fire', 'earth', 'metal', 'water')),
	CONSTRAINT "practice_variant_season_element" CHECK ("practice_variant"."season_element" in ('wood', 'fire', 'earth', 'metal', 'water'))
);
--> statement-breakpoint
CREATE TABLE "practice_variant_type" (
	"variant_id" uuid NOT NULL,
	"type_id" text NOT NULL,
	CONSTRAINT "practice_variant_type_variant_id_type_id_pk" PRIMARY KEY("variant_id","type_id")
);
--> statement-breakpoint
ALTER TABLE "practice" ADD COLUMN "new_each_week" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "practice" ADD COLUMN "alternation" "practice_alternation";--> statement-breakpoint
ALTER TABLE "practice_variant" ADD CONSTRAINT "practice_variant_practice_id_practice_id_fk" FOREIGN KEY ("practice_id") REFERENCES "public"."practice"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "practice_variant_type" ADD CONSTRAINT "practice_variant_type_variant_id_practice_variant_id_fk" FOREIGN KEY ("variant_id") REFERENCES "public"."practice_variant"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "practice_variant_practice_idx" ON "practice_variant" USING btree ("practice_id");