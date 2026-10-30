// Программа: практики, послания навигатора и прогресс человека. Разделы 3а и 4 в docs/data-model.md.
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { user } from "./auth";

/**
 * Ежедневная практика — каждый день, еженедельная — один раз в неделю, в любой день.
 * Осознание — отдельный блок программы («2 жизни», на слабую стихию).
 */
export const practiceFrequency = pgEnum("practice_frequency", ["daily", "weekly", "awareness"]);
/**
 * Чередование с 15-го дня: «first» — в 3-ю, 5-ю… неделю программы, «second» — в 4-ю, 6-ю…
 * Так чередуются медитация на качество силы и медитация на слабую стихию.
 */
export const practiceAlternation = pgEnum("practice_alternation", ["first", "second"]);
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
    /** Каждую неделю, когда практика есть в программе, — следующий вариант по порядку, потом по кругу. */
    newEachWeek: boolean("new_each_week").notNull().default(false),
    /** Пусто — без чередования. */
    alternation: practiceAlternation("alternation"),
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

/**
 * Вариант практики: свой текст, аудио или видео для типа, слабой стихии или стихии года.
 * Если у практики есть варианты, человек видит подходящий ему; не подошёл ни один — практики у него нет.
 * Без вариантов — текст самой практики, для всех.
 */
export const practiceVariant = pgTable(
  "practice_variant",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    practiceId: uuid("practice_id")
      .notNull()
      .references(() => practice.id, { onDelete: "cascade" }),
    /** Порядок вариантов: по нему они идут неделя за неделей. */
    position: smallint("position").notNull(),
    body: text("body").notNull().default(""),
    audioPath: text("audio_path"),
    videoUrl: text("video_url"),
    /** Для какой слабой стихии человека. Пусто — для любой. */
    weakElement: text("weak_element"),
    /** На какую стихию года. Пусто — на любую. */
    seasonElement: text("season_element"),
  },
  (table) => [
    index("practice_variant_practice_idx").on(table.practiceId),
    check("practice_variant_weak_element", sql`${table.weakElement} in ('wood', 'fire', 'earth', 'metal', 'water')`),
    check(
      "practice_variant_season_element",
      sql`${table.seasonElement} in ('wood', 'fire', 'earth', 'metal', 'water')`,
    ),
  ],
);

/** Каким типам подходит вариант (t1–t12). Ни одного — всем. */
export const practiceVariantType = pgTable(
  "practice_variant_type",
  {
    variantId: uuid("variant_id")
      .notNull()
      .references(() => practiceVariant.id, { onDelete: "cascade" }),
    typeId: text("type_id").notNull(),
  },
  (table) => [primaryKey({ columns: [table.variantId, table.typeId] })],
);

/** Послание Мастера для навигатора дня: три части на неделю. */
export const navigatorMessage = pgTable("navigator_message", {
  id: uuid("id").primaryKey().defaultRandom(),
  masterName: text("master_name").notNull(),
  /** Порядок, в котором послания приходят. */
  position: smallint("position").notNull(),
  /** Задание седьмого дня, когда читают послание полностью. Пусто — без задания. */
  day7Task: text("day7_task"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

/**
 * Часть послания (1–3) и её два задания: на первый и второй день части.
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

/** Каким типам подходит послание (t1–t12, src/entities/person-type). */
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

/** «Прочитано» на экране навигатора: какое послание и в какой день. */
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

/**
 * Видео раздела «Библиотека»: приветственное (welcome) и по каждой стихии (wood, fire, earth, metal, water).
 * Ссылка на YouTube и текст под видео.
 */
export const programVideo = pgTable(
  "program_video",
  {
    slot: text("slot").primaryKey(),
    videoUrl: text("video_url"),
    body: text("body").notNull().default(""),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [check("program_video_slot", sql`${table.slot} in ('welcome', 'wood', 'fire', 'earth', 'metal', 'water')`)],
);
