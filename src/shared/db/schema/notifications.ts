// Уведомления администратору на телефон (web-push). Раздел «Доступ по подписке» в docs/data-model.md.
import { index, pgTable, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Устройство, на которое администратор разрешил уведомления. Одно на браузер. */
export const pushSubscription = pgTable(
  "push_subscription",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Адрес службы уведомлений браузера (Apple, Google, Mozilla). */
    endpoint: text("endpoint").notNull().unique(),
    p256dh: text("p256dh").notNull(),
    auth: text("auth").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("push_subscription_user_idx").on(table.userId)],
);

/**
 * Кто уже был в ежедневной сводке «доступ скоро закончится».
 * Один раз на каждый срок доступа: продлили — дата окончания новая, человек попадёт в сводку снова.
 */
export const accessExpiryReminder = pgTable(
  "access_expiry_reminder",
  {
    email: text("email").notNull(),
    /** До какого момента был доступ, когда о нём напомнили. */
    accessUntil: timestamp("access_until", { withTimezone: true }).notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.email, table.accessUntil] }), index("access_expiry_reminder_sent_idx").on(table.sentAt)],
);
