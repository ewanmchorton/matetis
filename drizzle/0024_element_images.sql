CREATE TYPE "public"."element_image_kind" AS ENUM('main', 'practice');--> statement-breakpoint
CREATE TABLE "element_image" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"element_id" text NOT NULL,
	"kind" "element_image_kind" NOT NULL,
	"position" smallint DEFAULT 1 NOT NULL,
	"file_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "element_image_element" CHECK ("element_image"."element_id" in ('wood', 'fire', 'earth', 'metal', 'water')),
	CONSTRAINT "element_image_position" CHECK ("element_image"."position" >= 1)
);--> statement-breakpoint
CREATE UNIQUE INDEX "element_image_one_main" ON "element_image" USING btree ("element_id") WHERE "element_image"."kind" = 'main';
