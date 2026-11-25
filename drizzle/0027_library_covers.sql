ALTER TABLE "element_recommendation" ADD COLUMN "cover_path" text;--> statement-breakpoint
CREATE TABLE "library_book_cover" (
	"book_id" text PRIMARY KEY NOT NULL,
	"file_name" text NOT NULL
);
