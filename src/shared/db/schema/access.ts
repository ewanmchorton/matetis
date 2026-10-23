// Доступ к приложению по подписке. Раздел «Доступ» в docs/data-model.md.
// Каждое открытие и продление — отдельный период. Связь с человеком — по почте:
// админ может открыть доступ до того, как человек зарегистрировался.
import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Как оплачен период. Платёжный сервис добавит сюда своё значение. */
export const accessPaymentMethod = pgEnum("access_payment_method", ["manual"]);

export const accessPeriod = pgTable(
  "access_period",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Строчными буквами, без пробелов по краям. */
    email: text("email").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    /** Сумма в евроцентах: 20 € = 2000. */
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("EUR"),
    method: accessPaymentMethod("method").notNull().default("manual"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("access_period_email_normalized", sql`${table.email} = lower(btrim(${table.email})) and ${table.email} <> ''`),
    check("access_period_dates", sql`${table.endsAt} >= ${table.startsAt}`),
    check("access_period_amount", sql`${table.amountCents} >= 0`),
    index("access_period_email_ends_idx").on(table.email, table.endsAt),
  ],
);

/** Настройки доступа: всегда одна запись. Меняет только администратор. */
export const accessSettings = pgTable(
  "access_settings",
  {
    id: boolean("id").primaryKey().default(true),
    /** Телефон администратора для Telegram и Viber. */
    adminPhone: text("admin_phone").notNull(),
    firstMonthCents: integer("first_month_cents").notNull(),
    monthCents: integer("month_cents").notNull(),
    threeMonthsCents: integer("three_months_cents").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check("access_settings_single_row", sql`${table.id}`),
    check(
      "access_settings_prices",
      sql`${table.firstMonthCents} >= 0 and ${table.monthCents} >= 0 and ${table.threeMonthsCents} >= 0`,
    ),
  ],
);
