// Расчёт по дате рождения: квадрат Пифагора. Раздел 2 в docs/data-model.md, методика — docs/elements-method.md.
// Храним, сколько раз встречается каждая цифра 0–9. Суммы по стихиям и оценки
// не храним: сервер считает их из цифр по таблице соответствия.
import { sql } from "drizzle-orm";
import { check, date, pgTable, smallint, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

const digitCount = (name: string) => smallint(name).notNull();

// Одна строка на человека. Новая дата перезаписывает строку.
export const birthReading = pgTable(
  "birth_reading",
  {
    userId: text("user_id")
      .primaryKey()
      .references(() => user.id, { onDelete: "cascade" }),
    birthDate: date("birth_date", { mode: "string" }).notNull(),
    // Ноль считается с 31.10.2026 (новая схема Жанны). Значение по умолчанию нужно только
    // для уже сохранённых строк при добавлении столбца — миграция сразу их пересчитывает.
    digit0: digitCount("digit_0").default(0),
    digit1: digitCount("digit_1"),
    digit2: digitCount("digit_2"),
    digit3: digitCount("digit_3"),
    digit4: digitCount("digit_4"),
    digit5: digitCount("digit_5"),
    digit6: digitCount("digit_6"),
    digit7: digitCount("digit_7"),
    digit8: digitCount("digit_8"),
    digit9: digitCount("digit_9"),
    calculatedAt: timestamp("calculated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "birth_reading_digits_not_negative",
      sql`least(${table.digit0}, ${table.digit1}, ${table.digit2}, ${table.digit3}, ${table.digit4}, ${table.digit5}, ${table.digit6}, ${table.digit7}, ${table.digit8}, ${table.digit9}) >= 0`,
    ),
  ],
);
