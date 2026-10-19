CREATE TABLE "birth_reading" (
	"user_id" text PRIMARY KEY NOT NULL,
	"birth_date" date NOT NULL,
	"digit_1" smallint NOT NULL,
	"digit_2" smallint NOT NULL,
	"digit_3" smallint NOT NULL,
	"digit_4" smallint NOT NULL,
	"digit_5" smallint NOT NULL,
	"digit_6" smallint NOT NULL,
	"digit_7" smallint NOT NULL,
	"digit_8" smallint NOT NULL,
	"digit_9" smallint NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "birth_reading_digits_not_negative" CHECK (least("birth_reading"."digit_1", "birth_reading"."digit_2", "birth_reading"."digit_3", "birth_reading"."digit_4", "birth_reading"."digit_5", "birth_reading"."digit_6", "birth_reading"."digit_7", "birth_reading"."digit_8", "birth_reading"."digit_9") >= 0)
);
--> statement-breakpoint
ALTER TABLE "birth_reading" ADD CONSTRAINT "birth_reading_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;