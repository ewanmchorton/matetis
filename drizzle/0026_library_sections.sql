CREATE TYPE "public"."element_recommendation_kind" AS ENUM('book', 'film');--> statement-breakpoint
CREATE TYPE "public"."library_practice_kind" AS ENUM('video', 'audio');--> statement-breakpoint
CREATE TABLE "element_recommendation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"element_id" text NOT NULL,
	"kind" "element_recommendation_kind" NOT NULL,
	"title" text NOT NULL,
	"author" text,
	"year" smallint,
	"position" smallint DEFAULT 1 NOT NULL,
	CONSTRAINT "element_recommendation_element" CHECK ("element_recommendation"."element_id" in ('wood', 'fire', 'earth', 'metal', 'water')),
	CONSTRAINT "element_recommendation_position" CHECK ("element_recommendation"."position" >= 1)
);--> statement-breakpoint
CREATE TABLE "library_practice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"kind" "library_practice_kind" NOT NULL,
	"video_url" text,
	"audio_path" text,
	"position" smallint NOT NULL,
	CONSTRAINT "library_practice_position" CHECK ("library_practice"."position" >= 1)
);--> statement-breakpoint
INSERT INTO "program_video" ("slot", "body") VALUES ('water', $water$Активные органы – почки, мочеполовая система, кости и уши.

Уши сами по себе не болят: любая боль в них – сигнал о нехватке энергии в почках. Причём сигналы идут перекрёстно: левое ухо говорит о правой почке, правое – о левой.

Почки – один из самых важных органов. Это наш жизненный аккумулятор. В них хранится весь запас жизненной энергии, который мы получаем при рождении от Земли, Космоса и родителей. Этот запас называют «неприкосновенным Ци». Именно от него во многом зависит продолжительность жизни. Если этот ресурс будет исчерпан слишком рано, жизнь в теле может завершиться, даже если остальные органы ещё в порядке.

Главные причины быстрой потери «неприкосновенного Ци»:

• Страх
• Невежественный секс
• Все виды привязанностей и зависимостей (ведь они тоже основаны на страхе потери)

Качества, которые особенно важно развивать в Стихии Воды:

• Воля
• Усердие
• Дисциплина
• Нежность
• Мягкость
• Кротость
• Щедрость
• Благородство

Почки и мочевой пузырь первыми подают сигналы, когда мы слишком долго держим напряжение и не даём эмоциям мягко протекать.

Позвольте себе чуть меньше контролировать и чуть больше чувствовать – и Стихия Воды начнёт мягко вас поддерживать.$water$)
ON CONFLICT ("slot") DO NOTHING;--> statement-breakpoint
INSERT INTO "element_recommendation" ("element_id", "kind", "title", "author", "position") VALUES
('water', 'book', 'Дао дэ цзин', 'Лао-цзы', 1),
('water', 'book', 'Цигун для начинающих', 'Мантак Чиа', 2);--> statement-breakpoint
INSERT INTO "element_recommendation" ("element_id", "kind", "title", "year", "position") VALUES
('water', 'film', 'Весна, лето, осень, зима… и снова весна', 2003, 1);--> statement-breakpoint
INSERT INTO "library_practice" ("title", "kind", "position") VALUES
('Золотая подушечка', 'audio', 1),
('Техника Золотого Шара', 'audio', 2);
