// Картинки стихии: одна основная (библиотека и фон программы) и несколько для экранов практик.
import { check, pgEnum, pgTable, smallint, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const elementImageKind = pgEnum("element_image_kind", ["main", "practice"]);

/** Файл лежит в private/element-images. Отдаётся через /api/element-image. */
export const elementImage = pgTable(
  "element_image",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    elementId: text("element_id").notNull(),
    kind: elementImageKind("kind").notNull(),
    /** Порядок картинок экранов практик. У основной всегда 1. */
    position: smallint("position").notNull().default(1),
    /** Имя файла внутри private/element-images, например «….jpg». */
    fileName: text("file_name").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("element_image_element", sql`${table.elementId} in ('wood', 'fire', 'earth', 'metal', 'water')`),
    check("element_image_position", sql`${table.position} >= 1`),
    uniqueIndex("element_image_one_main").on(table.elementId).where(sql`${table.kind} = 'main'`),
  ],
);
