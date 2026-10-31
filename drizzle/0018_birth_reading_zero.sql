ALTER TABLE "birth_reading" DROP CONSTRAINT "birth_reading_digits_not_negative";--> statement-breakpoint
ALTER TABLE "birth_reading" ADD COLUMN "digit_0" smallint DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "birth_reading" ADD CONSTRAINT "birth_reading_digits_not_negative" CHECK (least("birth_reading"."digit_0", "birth_reading"."digit_1", "birth_reading"."digit_2", "birth_reading"."digit_3", "birth_reading"."digit_4", "birth_reading"."digit_5", "birth_reading"."digit_6", "birth_reading"."digit_7", "birth_reading"."digit_8", "birth_reading"."digit_9") >= 0);--> statement-breakpoint
-- Пересчёт уже сохранённых строк по новой методике: ноль считается, дата берётся как ДД.ММ.ГГГГ.
-- Повторяет calculateBirthSquare из src/entities/birth-reading/model/calculate.ts.
UPDATE "birth_reading" AS b SET
  "digit_0" = length(c.all_digits) - length(replace(c.all_digits, '0', '')),
  "digit_1" = length(c.all_digits) - length(replace(c.all_digits, '1', '')),
  "digit_2" = length(c.all_digits) - length(replace(c.all_digits, '2', '')),
  "digit_3" = length(c.all_digits) - length(replace(c.all_digits, '3', '')),
  "digit_4" = length(c.all_digits) - length(replace(c.all_digits, '4', '')),
  "digit_5" = length(c.all_digits) - length(replace(c.all_digits, '5', '')),
  "digit_6" = length(c.all_digits) - length(replace(c.all_digits, '6', '')),
  "digit_7" = length(c.all_digits) - length(replace(c.all_digits, '7', '')),
  "digit_8" = length(c.all_digits) - length(replace(c.all_digits, '8', '')),
  "digit_9" = length(c.all_digits) - length(replace(c.all_digits, '9', '')),
  "calculated_at" = now()
FROM (
  SELECT r."user_id",
    d.s || n1.v::text || n2.v::text || abs(n3.v)::text || n4.v::text AS all_digits
  FROM "birth_reading" r
  CROSS JOIN LATERAL (SELECT to_char(r."birth_date", 'DDMMYYYY') AS s) d
  CROSS JOIN LATERAL (SELECT (SELECT sum(x::int) FROM regexp_split_to_table(d.s, '') x)::int AS v) n1
  CROSS JOIN LATERAL (SELECT (SELECT sum(x::int) FROM regexp_split_to_table(n1.v::text, '') x)::int AS v) n2
  CROSS JOIN LATERAL (SELECT n1.v - 2 * substr(ltrim(substr(d.s, 1, 2), '0'), 1, 1)::int AS v) n3
  CROSS JOIN LATERAL (SELECT (SELECT sum(x::int) FROM regexp_split_to_table(abs(n3.v)::text, '') x)::int AS v) n4
) AS c
WHERE b."user_id" = c."user_id";
