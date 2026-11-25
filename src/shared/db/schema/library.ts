// Библиотека: рекомендации на странице стихии и редкие практики (не из ежедневной программы).
import { check, pgEnum, pgTable, smallint, text, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const elementRecommendationKind = pgEnum("element_recommendation_kind", ["book", "film"]);

/** Книга или фильм на странице стихии. Ничего не открывает: только название и, у книги, автор. */
export const elementRecommendation = pgTable(
  "element_recommendation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    elementId: text("element_id").notNull(),
    kind: elementRecommendationKind("kind").notNull(),
    title: text("title").notNull(),
    author: text("author"),
    year: smallint("year"),
    position: smallint("position").notNull().default(1),
  },
  (table) => [
    check("element_recommendation_element", sql`${table.elementId} in ('wood', 'fire', 'earth', 'metal', 'water')`),
    check("element_recommendation_position", sql`${table.position} >= 1`),
  ],
);

export const libraryPracticeKind = pgEnum("library_practice_kind", ["video", "audio"]);

/** Редкая практика библиотеки: название, текст и видео или аудио. Приветственное видео хранится отдельно. */
export const libraryPractice = pgTable(
  "library_practice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    kind: libraryPracticeKind("kind").notNull(),
    videoUrl: text("video_url"),
    audioPath: text("audio_path"),
    position: smallint("position").notNull(),
  },
  (table) => [check("library_practice_position", sql`${table.position} >= 1`)],
);
