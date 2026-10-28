CREATE TABLE "metal_start" (
	"year" smallint PRIMARY KEY NOT NULL,
	"starts_on" date NOT NULL,
	"set_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "metal_start" ADD CONSTRAINT "metal_start_set_by_user_id_fk" FOREIGN KEY ("set_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;