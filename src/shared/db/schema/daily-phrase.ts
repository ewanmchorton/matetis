// Фразы дня: короткие цитаты, которые раз в день приходят человеку уведомлением в случайное время.
// Раздел «Фразы дня» в docs/data-model.md.
import { date, index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Фраза. Загружает админ или контент-менеджер. */
export const dailyPhrase = pgTable("daily_phrase", {
  id: uuid("id").primaryKey().defaultRandom(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Каким типам подходит фраза (id типа: t1–t12, src/entities/person-type).
 * Нет ни одной строки — фраза подходит всем.
 */
export const dailyPhraseType = pgTable(
  "daily_phrase_type",
  {
    phraseId: uuid("phrase_id")
      .notNull()
      .references(() => dailyPhrase.id, { onDelete: "cascade" }),
    typeId: text("type_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.phraseId, table.typeId] })],
);

/**
 * Фраза дня человеку: на какой день по его часам, когда отправить и что ушло.
 * Одна строка на человека в день — так фраза не придёт дважды.
 */
export const dailyPhraseDelivery = pgTable(
  "daily_phrase_delivery",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** День по часовому поясу телефона человека. */
    day: date("day").notNull(),
    /** Случайный момент внутри выбранного человеком промежутка. */
    sendAt: timestamp("send_at", { withTimezone: true }).notNull(),
    /** Какая фраза ушла. Пусто, пока не отправлено, или если фразу потом удалили. */
    phraseId: uuid("phrase_id").references(() => dailyPhrase.id, { onDelete: "set null" }),
    sentAt: timestamp("sent_at", { withTimezone: true }),
  },
  (table) => [primaryKey({ columns: [table.userId, table.day] }), index("daily_phrase_delivery_send_idx").on(table.sendAt)],
);
