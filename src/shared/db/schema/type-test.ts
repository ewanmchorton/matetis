// Прохождения теста на тип. Раздел 2 в docs/data-model.md.
// Тест проходят после каждой стихии, каждое прохождение сохраняется.
// Тип не храним: это код из двух ответов (А + 2 = «А2»), текущий тип — по последнему прохождению.
import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const typeTestAttempt = pgTable(
  "type_test_attempt",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Выбор в группе 1: «А», «В» или «С» (русские буквы). */
    group1Code: text("group1_code").notNull(),
    /** Выбор в группе 2: «1»–«4». */
    group2Code: text("group2_code").notNull(),
    takenAt: timestamp("taken_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("type_test_attempt_group1_code", sql`${table.group1Code} in ('А', 'В', 'С')`),
    check("type_test_attempt_group2_code", sql`${table.group2Code} in ('1', '2', '3', '4')`),
    index("type_test_attempt_user_taken_idx").on(table.userId, table.takenAt),
  ],
);
