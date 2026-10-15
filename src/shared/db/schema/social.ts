// Друзья и настройки человека. Раздел 5 в docs/data-model.md.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

export const friendRequestStatus = pgEnum("friend_request_status", [
  "pending",
  "accepted",
  "declined",
]);

// Запрос в друзья. Дружба — это принятый запрос, отдельной таблицы друзей нет.
// На одну пару людей — одна запись, в каком бы направлении ни шёл запрос.
export const friendRequest = pgTable(
  "friend_request",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    fromUserId: text("from_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    toUserId: text("to_user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    status: friendRequestStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    check("friend_request_not_self", sql`${table.fromUserId} <> ${table.toUserId}`),
    uniqueIndex("friend_request_pair_unique").on(
      sql`least(${table.fromUserId}, ${table.toUserId})`,
      sql`greatest(${table.fromUserId}, ${table.toUserId})`,
    ),
    index("friend_request_to_user_idx").on(table.toUserId),
    index("friend_request_from_user_idx").on(table.fromUserId),
  ],
);

// Личные настройки. Видит и меняет только сам человек.
// Строка создаётся при первом изменении, до этого действуют значения по умолчанию.
export const personSettings = pgTable("person_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  publishEvents: boolean("publish_events").notNull().default(true),
  autoMatchConsent: boolean("auto_match_consent").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
