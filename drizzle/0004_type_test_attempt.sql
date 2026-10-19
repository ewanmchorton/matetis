CREATE TABLE "type_test_attempt" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"group1_code" text NOT NULL,
	"group2_code" text NOT NULL,
	"taken_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "type_test_attempt_group1_code" CHECK ("type_test_attempt"."group1_code" in ('А', 'В', 'С')),
	CONSTRAINT "type_test_attempt_group2_code" CHECK ("type_test_attempt"."group2_code" in ('1', '2', '3', '4'))
);
--> statement-breakpoint
ALTER TABLE "type_test_attempt" ADD CONSTRAINT "type_test_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "type_test_attempt_user_taken_idx" ON "type_test_attempt" USING btree ("user_id","taken_at");