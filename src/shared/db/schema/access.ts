// Доступ к приложению по подписке. Раздел «Доступ» в docs/data-model.md.
// Каждое открытие и продление — отдельный период. Связь с человеком — по контакту (почта или @ник в Telegram):
// админ может открыть доступ до того, как человек зарегистрировался.
import { sql } from "drizzle-orm";
import { boolean, check, index, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Формат контакта для проверки в базе. Совпадает с правилами в src/shared/auth/contact.ts. */
const CONTACT_PATTERN_SQL = sql.raw(`'^(@[a-z0-9_]{5,32}|tg:[0-9]+|[^@\\s]+@[^@\\s]+\\.[^@\\s]+)$'`);

/** Как оплачен период. Платёжный сервис добавит сюда своё значение. */
export const accessPaymentMethod = pgEnum("access_payment_method", ["manual"]);

export const accessPeriod = pgTable(
  "access_period",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    /** Почта, @ник или tg:номер в Telegram — строчными, см. src/shared/auth/contact.ts. */
    contact: text("contact").notNull(),
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
    check("access_period_contact_format", sql`${table.contact} ~ ${CONTACT_PATTERN_SQL}`),
    check("access_period_dates", sql`${table.endsAt} >= ${table.startsAt}`),
    check("access_period_amount", sql`${table.amountCents} >= 0`),
    index("access_period_contact_ends_idx").on(table.contact, table.endsAt),
  ],
);

/** Настройки доступа: всегда одна запись. Меняет только администратор. */
export const accessSettings = pgTable(
  "access_settings",
  {
    id: boolean("id").primaryKey().default(true),
    /** Телефон администратора: виден на экране, по нему открывается чат в Viber. */
    adminPhone: text("admin_phone").notNull(),
    /** Ник администратора в Telegram без @: по нему чат открывается с готовым сообщением. На экране не виден. */
    adminTelegram: text("admin_telegram").notNull().default(""),
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
