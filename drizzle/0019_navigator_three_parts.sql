-- Старые послания из двух частей удаляются: их заменяют новые, из трёх частей (решение от 11 ноября 2026).
DELETE FROM "navigator_message";--> statement-breakpoint
ALTER TABLE "elder_message" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "elder_message_type" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "elder_message" CASCADE;--> statement-breakpoint
DROP TABLE "elder_message_type" CASCADE;--> statement-breakpoint
ALTER TABLE "navigator_part" DROP CONSTRAINT "navigator_part_number";--> statement-breakpoint
ALTER TABLE "navigator_message" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "navigator_message" ADD COLUMN "given_on" date NOT NULL;--> statement-breakpoint
ALTER TABLE "navigator_message" ADD COLUMN "intro" text NOT NULL;--> statement-breakpoint
ALTER TABLE "navigator_message" ADD COLUMN "closing" text NOT NULL;--> statement-breakpoint
ALTER TABLE "navigator_message" ADD COLUMN "day7_task" text;--> statement-breakpoint
ALTER TABLE "navigator_part" ADD CONSTRAINT "navigator_part_number" CHECK ("navigator_part"."part" between 1 and 3);