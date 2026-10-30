// Программа человека на сегодня: открытые практики, отметки, навигатор. Только серверный код.
// Доступ к программе проверяет вызывающий код. Дни — по часам телефона человека (его часовой пояс
// в настройках); пока телефон его не сообщил — по Минску.
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { getMyBirthReading, weakestElement } from "@/entities/birth-reading/server";
import { DEFAULT_TIME_ZONE, localDay } from "@/entities/daily-phrase";
import { getCurrentSeason, type Season } from "@/entities/element/server";
import { getMyCurrentType } from "@/entities/type-test-attempt/server";
import {
  db,
  elderMessage,
  elderMessageType,
  navigatorMessage,
  navigatorMessageType,
  navigatorPart,
  navigatorRead,
  personSettings,
  practiceMark,
  practiceNote,
  programStart,
  welcomeVideoSeen,
} from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import {
  navigatorDay,
  navigatorPosition,
  programDayNumber,
  programWeek,
  shownInWeek,
  weekDays,
  weeksShownBefore,
  type NavigatorDay,
} from "../model/program-day";
import { listPractices, type Practice, type PracticeVariant } from "./program-content.server";

/** Сегодняшний день по часам человека: «2026-12-25». */
async function todayFor(userId: string, now: Date): Promise<string> {
  const [row] = await db
    .select({ timeZone: personSettings.timeZone })
    .from(personSettings)
    .where(eq(personSettings.userId, userId));
  return localDay(now, row?.timeZone ?? DEFAULT_TIME_ZONE);
}

/** Первый день человека в программе. В первый раз — сегодня. */
async function startedOn(userId: string, today: string): Promise<string> {
  await db.insert(programStart).values({ userId, startedOn: today }).onConflictDoNothing();
  const [row] = await db.select().from(programStart).where(eq(programStart.userId, userId));
  return row.startedOn;
}

export type NavigatorToday = NavigatorDay & {
  messageId: string;
  /** От чьего имени послание; в дни старцев — null. */
  masterName: string | null;
  /** Послание старцев на 6-й и 7-й день. */
  elders: { title: string; body: string } | null;
  read: boolean;
};

/** Послание старцев для типа на эту неделю навигатора: по порядку, по кругу. */
async function eldersFor(typeId: string, messageNumber: number) {
  const messages = await db
    .select({ title: elderMessage.title, body: elderMessage.body })
    .from(elderMessage)
    .innerJoin(elderMessageType, eq(elderMessageType.messageId, elderMessage.id))
    .where(eq(elderMessageType.typeId, typeId))
    .orderBy(asc(elderMessage.position), asc(elderMessage.createdAt));
  return messages.length > 0 ? messages[messageNumber % messages.length] : null;
}

/**
 * Послание человека на этот день программы: по порядку для его типа, по кругу.
 * null — нет типа или посланий; в дни старцев — если для типа нет послания старцев.
 */
async function navigatorFor(userId: string, programDay: number, today: string): Promise<NavigatorToday | null> {
  const type = await getMyCurrentType(userId);
  if (!type) return null;
  const messages = await db
    .select({ id: navigatorMessage.id, masterName: navigatorMessage.masterName, day5Task: navigatorMessage.day5Task })
    .from(navigatorMessage)
    .innerJoin(navigatorMessageType, eq(navigatorMessageType.messageId, navigatorMessage.id))
    .where(eq(navigatorMessageType.typeId, type.id))
    .orderBy(asc(navigatorMessage.position), asc(navigatorMessage.createdAt));
  if (messages.length === 0) return null;

  const { messageNumber, cycleDay } = navigatorPosition(programDay);
  const message = messages[messageNumber % messages.length];
  const day = navigatorDay(
    await db.select().from(navigatorPart).where(eq(navigatorPart.messageId, message.id)),
    message.day5Task,
    cycleDay,
  );
  const elders = day.kind === "elders" ? await eldersFor(type.id, messageNumber) : null;
  if (day.kind === "elders" && !elders) return null;
  const [read] = await db
    .select({ day: navigatorRead.day })
    .from(navigatorRead)
    .where(and(eq(navigatorRead.userId, userId), eq(navigatorRead.day, today)));
  return {
    ...day,
    messageId: message.id,
    masterName: day.kind === "elders" ? null : message.masterName,
    elders,
    read: Boolean(read),
  };
}

type Person = { typeId: string | null; weakElement: string | null; seasonElement: string };

/** Тип, слабая стихия и стихия года — по ним выбирается вариант практики. */
async function personFor(userId: string, season: Season): Promise<Person> {
  const [type, reading] = await Promise.all([getMyCurrentType(userId), getMyBirthReading(userId)]);
  return {
    typeId: type?.id ?? null,
    weakElement: reading ? weakestElement(reading.elements) : null,
    seasonElement: season.elementId,
  };
}

function fits(variant: PracticeVariant, person: Person) {
  return (
    (variant.typeIds.length === 0 || (person.typeId !== null && variant.typeIds.includes(person.typeId))) &&
    (variant.weakElement === null || variant.weakElement === person.weakElement) &&
    (variant.seasonElement === null || variant.seasonElement === person.seasonElement)
  );
}

type VisiblePractice = { item: Practice; variant: PracticeVariant | null };

/**
 * Практики человека в этот день программы. Без вариантов — текст самой практики для всех.
 * С вариантами — подходящий человеку; если каждую неделю новый — следующий по порядку, по кругу.
 * Не подошёл ни один вариант — практики у человека нет.
 */
function visiblePractices(practices: Practice[], person: Person, programDay: number): VisiblePractice[] {
  const week = programWeek(programDay);
  return practices.flatMap((item): VisiblePractice[] => {
    if (item.opensOnDay > programDay || !shownInWeek(week, item.opensOnDay, item.alternation)) return [];
    if (item.variants.length === 0) return [{ item, variant: null }];
    const suitable = item.variants.filter((variant) => fits(variant, person));
    if (suitable.length === 0) return [];
    const index = item.newEachWeek ? weeksShownBefore(week, item.opensOnDay, item.alternation) % suitable.length : 0;
    return [{ item, variant: suitable[index] }];
  });
}

export type ProgramPractice = {
  id: string;
  /** Какой вариант текста видит человек. null — текст самой практики. */
  variantId: string | null;
  title: string;
  daypart: "morning" | "evening" | null;
  hasVideo: boolean;
  hasAudio: boolean;
  /** Ежедневная — отмечена сегодня; еженедельная — день отметки на этой неделе. */
  doneOn: string | null;
};

export type MyProgram = {
  today: string;
  programDay: number;
  season: Season;
  navigator: NavigatorToday | null;
  morning: ProgramPractice[];
  evening: ProgramPractice[];
  weekly: ProgramPractice[];
  awareness: ProgramPractice[];
  /** Семь дней недели с понедельника: был ли в этот день хоть одна выполненная практика. */
  week: { day: string; done: boolean }[];
  /** Приветственное видео ещё не просмотрено — показать перед программой. */
  showWelcomeVideo: boolean;
};

/** Программа человека на сегодня. В первый раз запоминает его первый день. */
export async function getMyProgram(userId: string, now = new Date()): Promise<MyProgram> {
  const today = await todayFor(userId, now);
  const days = weekDays(today);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  const [season, navigator, practices, marks, reads, [welcome]] = await Promise.all([
    getCurrentSeason(now),
    navigatorFor(userId, programDay, today),
    listPractices(),
    db
      .select({ practiceId: practiceMark.practiceId, day: practiceMark.day })
      .from(practiceMark)
      .where(and(eq(practiceMark.userId, userId), gte(practiceMark.day, days[0]), lte(practiceMark.day, days[6]))),
    db
      .select({ day: navigatorRead.day })
      .from(navigatorRead)
      .where(and(eq(navigatorRead.userId, userId), gte(navigatorRead.day, days[0]), lte(navigatorRead.day, days[6]))),
    db.select().from(welcomeVideoSeen).where(eq(welcomeVideoSeen.userId, userId)),
  ]);

  const open = visiblePractices(practices, await personFor(userId, season), programDay);
  const view = ({ item, variant }: VisiblePractice): ProgramPractice => ({
    id: item.id,
    variantId: variant?.id ?? null,
    title: item.title,
    daypart: item.daypart,
    hasVideo: Boolean((variant ?? item).videoUrl),
    hasAudio: Boolean((variant ?? item).audioPath),
    doneOn:
      marks.find((mark) => mark.practiceId === item.id && (item.frequency === "weekly" || mark.day === today))?.day ??
      null,
  });
  const doneDays = new Set([...marks.map((mark) => mark.day), ...reads.map((read) => read.day)]);
  return {
    today,
    programDay,
    season,
    navigator,
    morning: open.filter(({ item }) => item.daypart === "morning").map(view),
    evening: open.filter(({ item }) => item.daypart === "evening").map(view),
    weekly: open.filter(({ item }) => item.frequency === "weekly").map(view),
    awareness: open.filter(({ item }) => item.frequency === "awareness").map(view),
    week: days.map((day) => ({ day, done: doneDays.has(day) })),
    showWelcomeVideo: !welcome,
  };
}

/** Навигатор на сегодня для экрана послания. */
export async function getMyNavigator(userId: string, now = new Date()) {
  const today = await todayFor(userId, now);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  return navigatorFor(userId, programDay, today);
}

/**
 * Отметить практику выполненной сегодня или снять отметку.
 * Ежедневная — одна отметка в день, еженедельная — одна в неделю. Закрытую практику отметить нельзя.
 */
export async function setPracticeDone(userId: string, practiceId: unknown, done: boolean, now = new Date()) {
  if (typeof practiceId !== "string") throw new AppError("not_found", "Практика не найдена");
  const today = await todayFor(userId, now);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  const [practices, season] = await Promise.all([listPractices(), getCurrentSeason(now)]);
  const visible = visiblePractices(practices, await personFor(userId, season), programDay);
  const item = visible.find((entry) => entry.item.id === practiceId)?.item;
  if (!item) throw new AppError("not_found", "Практика не найдена");

  const days = item.frequency === "weekly" ? weekDays(today) : [today];
  const period = and(
    eq(practiceMark.userId, userId),
    eq(practiceMark.practiceId, practiceId),
    inArray(practiceMark.day, days),
  );
  if (!done) {
    await db.delete(practiceMark).where(period);
    return { ok: true };
  }
  const [already] = await db.select({ day: practiceMark.day }).from(practiceMark).where(period).limit(1);
  if (!already) await db.insert(practiceMark).values({ userId, practiceId, day: today }).onConflictDoNothing();
  return { ok: true };
}

/** «Прочитано» на экране навигатора. */
export async function markNavigatorRead(userId: string, now = new Date()) {
  const today = await todayFor(userId, now);
  const navigator = await getMyNavigator(userId, now);
  if (!navigator) throw new AppError("no_navigator", "Послание пока не готово");
  await db.insert(navigatorRead).values({ userId, day: today, messageId: navigator.messageId }).onConflictDoNothing();
  return { ok: true };
}

/** Заметка для себя к практике на сегодня. Пустая — удаляется. */
export async function saveMyNote(userId: string, practiceId: unknown, rawText: unknown, now = new Date()) {
  if (typeof practiceId !== "string") throw new AppError("not_found", "Практика не найдена");
  const today = await todayFor(userId, now);
  const key = and(eq(practiceNote.userId, userId), eq(practiceNote.practiceId, practiceId), eq(practiceNote.day, today));
  const text = typeof rawText === "string" ? rawText.trim().slice(0, 2000) : "";
  if (!text) {
    await db.delete(practiceNote).where(key);
    return { text: "" };
  }
  await db
    .insert(practiceNote)
    .values({ userId, practiceId, day: today, text })
    .onConflictDoUpdate({
      target: [practiceNote.userId, practiceNote.practiceId, practiceNote.day],
      set: { text, updatedAt: now },
    });
  return { text };
}

/** Своя заметка к практике на сегодня. */
export async function getMyNote(userId: string, practiceId: string, now = new Date()) {
  const [row] = await db
    .select({ text: practiceNote.text })
    .from(practiceNote)
    .where(and(eq(practiceNote.userId, userId), eq(practiceNote.practiceId, practiceId), eq(practiceNote.day, await todayFor(userId, now))));
  return { text: row?.text ?? "" };
}

/** Человек нажал «Просмотрено» у приветственного видео. */
export async function markWelcomeVideoSeen(userId: string) {
  await db.insert(welcomeVideoSeen).values({ userId }).onConflictDoNothing();
  return { ok: true };
}

