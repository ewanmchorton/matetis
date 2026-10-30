// Программа: практики, навигаторы дня и прогресс человека. Разделы 3а и 4 в docs/data-model.md.
import { sql } from "drizzle-orm";
import { check, date, index, pgEnum, pgTable, primaryKey, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

import { user } from "./auth";

/** Ежедневная практика — каждый день, еженедельная — один раз в неделю, в любой день. */
export const practiceFrequency = pgEnum("practice_frequency", ["daily", "weekly"]);
/** Где стоит ежедневная практика на экране программы. */
export const practiceDaypart = pgEnum("practice_daypart", ["morning", "evening"]);

/** Практика программы. Заполняет контент-менеджер или админ. */
export const practice = pgTable(
  "practice",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    frequency: practiceFrequency("frequency").notNull(),
    /** Утро или вечер — только у ежедневной. */
    daypart: practiceDaypart("daypart"),
    /** Место в своём списке, по возрастанию. */
    position: smallint("position").notNull(),
    body: text("body").notNull().default(""),
    /** Аудио на диске сервера: путь к файлу. */
    audioPath: text("audio_path"),
    /** Видео — ссылка на YouTube. */
    videoUrl: text("video_url"),
    /** С какого дня программы появляется у нового человека. */
    opensOnDay: smallint("opens_on_day").notNull().default(1),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    check(
      "practice_daypart_only_daily",
      sql`(${table.frequency} = 'daily') = (${table.daypart} is not null)`,
    ),
    check("practice_opens_on_day", sql`${table.opensOnDay} >= 1`),
  ],
);

/** Навигатор дня: текст Мастера из трёх частей на неделю. */
export const navigatorMessage = pgTable("navigator_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  masterName: text("master_name").notNull(),
  /** Порядок, в котором навигаторы приходят. */
  position: smallint("position").notNull(),
  /** Задание седьмого дня, когда читают навигатор полностью. Пусто — без задания. */
  day7Task: text("day7_task"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Часть навигатора (1–3) и её два задания: на первый и второй день части.
 * Пустые задания второй и третьей части — такие же, как у первой.
 */
export const navigatorPart = pgTable(
  "navigator_part",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => navigatorMessage.id, { onDelete: "cascade" }),
    part: smallint("part").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    firstDayTask: text("first_day_task"),
    secondDayTask: text("second_day_task"),
  },
  (table) => [
    primaryKey({ columns: [table.messageId, table.part] }),
    check("navigator_part_number", sql`${table.part} between 1 and 3`),
  ],
);

/** Каким типам подходит навигатор (t1–t12, src/entities/person-type). */
export const navigatorMessageType = pgTable(
  "navigator_message_type",
  {
    messageId: uuid("message_id")
      .notNull()
      .references(() => navigatorMessage.id, { onDelete: "cascade" }),
    typeId: text("type_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.messageId, table.typeId] })],
);

/** Первый день человека в программе (по Минску). От него считаются день программы и день навигатора. */
export const programStart = pgTable("program_start", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  startedOn: date("started_on").notNull(),
});

/** Отметка выполнения практики. Одна в день; у еженедельной — одна в неделю, это проверяет сервер. */
export const practiceMark = pgTable(
  "practice_mark",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practice.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.practiceId, table.day] }),
    index("practice_mark_user_day_idx").on(table.userId, table.day),
  ],
);

/** «Прочитано» на экране навигатора: какой навигатор и в какой день. */
export const navigatorRead = pgTable("navigator_read", {
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  day: date("day").notNull(),
  messageId: uuid("message_id").references(() => navigatorMessage.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [primaryKey({ columns: [table.userId, table.day] })]);

/** Заметка для себя к практике в этот день («Мышление по навигатору»). Видит только сам человек. */
export const practiceNote = pgTable(
  "practice_note",
  {
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practice.id, { onDelete: "cascade" }),
    day: date("day").notNull(),
    text: text("text").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.userId, table.practiceId, table.day] })],
);

/** Человек нажал «Просмотрено» у приветственного видео — больше оно не открывается. */
export const welcomeVideoSeen = pgTable("welcome_video_seen", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  seenAt: timestamp("seen_at", { withTimezone: true }).notNull().defaultNow(),
});
