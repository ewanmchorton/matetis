ALTER TABLE "practice" ADD COLUMN "span_weeks" smallint;--> statement-breakpoint
ALTER TABLE "practice_variant" ADD COLUMN "span_weeks" smallint;--> statement-breakpoint
ALTER TABLE "practice" ADD CONSTRAINT "practice_span_weeks" CHECK ("practice"."span_weeks" is null or "practice"."span_weeks" >= 1);--> statement-breakpoint
ALTER TABLE "practice_variant" ADD CONSTRAINT "practice_variant_span_weeks" CHECK ("practice_variant"."span_weeks" is null or "practice_variant"."span_weeks" >= 1);--> statement-breakpoint
UPDATE "practice" SET "span_weeks" = 1 WHERE "new_each_week" = true AND "alternation" IS NULL;