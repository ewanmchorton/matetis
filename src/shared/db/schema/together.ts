// Вместе: совместные практики, предложение месяца, лента событий друзей. Раздел 6 в docs/data-model.md.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";
import { practice } from "./program";

/** Откуда совместная практика: друг пригласил или приложение предложило пару на месяц. */
export const jointPracticeSource = pgEnum("joint_practice_source", ["invite", "monthly"]);

/**
 * Ждёт ответа → идёт 7 дней → завершена (сделали оба).
 * Или закрыта: отклонена, отменена пригласившим, прекращена участником, срок вышел.
 */
export const jointPracticeStatus = pgEnum("joint_practice_status", [
  "pending",
  "active",
  "completed",
  "declined",
  "cancelled",
  "stopped",
  "expired",
]);

/** Совместная практика двух людей. Отметки – обычные личные отметки практики, отдельно не хранятся. */
export const jointPractice = pgTable(
  "joint_practice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practice.id, { onDelete: "cascade" }),
    source: jointPracticeSource("source").notNull(),
    /** Кто пригласил. Пусто – предложение месяца. */
    invitedBy: text("invited_by").references(() => user.id, { onDelete: "cascade" }),
    status: jointPracticeStatus("status").notNull().default("pending"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    /** Общий период: 7 дней с дня, когда согласился последний. */
    startsOn: date("starts_on"),
    endsOn: date("ends_on"),
    closedAt: timestamp("closed_at", { withTimezone: true }),
  },
  (table) => [
    check("joint_practice_invite_has_author", sql`(${table.source} = 'invite') = (${table.invitedBy} is not null)`),
    check(
      "joint_practice_period_when_started",
      sql`${table.status} not in ('active', 'completed') or (${table.startsOn} is not null and ${table.endsOn} is not null)`,
    ),
  ],
);

/**
 * Участник совместной практики, их всегда двое.
 * «Открыта» дублирует статус практики (ждёт ответа или идёт), чтобы база сама не дала человеку
 * держать две открытые совместные практики – правило ТЗ «одна на человека».
 */
export const jointPracticeMember = pgTable(
  "joint_practice_member",
  {
    jointId: uuid("joint_id")
      .notNull()
      .references(() => jointPractice.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Когда согласился. У пригласившего – сразу. */
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    open: boolean("open").notNull().default(true),
    /** Закрыл карточку «Завершили». */
    dismissedAt: timestamp("dismissed_at", { withTimezone: true }),
  },
  (table) => [
    primaryKey({ columns: [table.jointId, table.userId] }),
    uniqueIndex("joint_practice_member_one_open").on(table.userId).where(sql`${table.open}`),
  ],
);

/** Кто уже получил предложение месяца. Одно на человека в месяц. */
export const monthlyMatch = pgTable(
  "monthly_match",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** Первое число месяца. */
    month: date("month").notNull(),
    jointId: uuid("joint_id")
      .notNull()
      .references(() => jointPractice.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.month] }),
    check("monthly_match_first_day", sql`extract(day from ${table.month}) = 1`),
  ],
);

/** Первая практика, завершение совместной, возвращение после перерыва больше 7 дней. */
export const feedEventKind = pgEnum("feed_event_kind", ["first_practice", "joint_completed", "comeback"]);

/** Событие ленты. Видят друзья автора. */
export const feedEvent = pgTable(
  "feed_event",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    kind: feedEventKind("kind").notNull(),
    /** Только у завершения совместной практики. */
    jointId: uuid("joint_id").references(() => jointPractice.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check("feed_event_joint_only_completed", sql`(${table.kind} = 'joint_completed') = (${table.jointId} is not null)`),
    uniqueIndex("feed_event_one_first").on(table.userId).where(sql`${table.kind} = 'first_practice'`),
    uniqueIndex("feed_event_one_per_joint").on(table.userId, table.jointId),
    index("feed_event_user_created_idx").on(table.userId, table.createdAt),
  ],
);

/** «Поддержать» – одна реакция человека на событие. */
export const feedReaction = pgTable(
  "feed_reaction",
  {
    eventId: uuid("event_id")
      .notNull()
      .references(() => feedEvent.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.eventId, table.userId] })],
);
