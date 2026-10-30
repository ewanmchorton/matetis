// Программа человека на сегодня: открытые практики, отметки, навигатор. Только серверный код.
// Доступ к программе проверяет вызывающий код. Дни — по Минску.
import { and, asc, eq, gte, inArray, lte } from "drizzle-orm";

import { localDay } from "@/entities/daily-phrase";
import { getCurrentSeason, type Season } from "@/entities/element/server";
import { getMyCurrentType } from "@/entities/type-test-attempt/server";
import {
  db,
  navigatorMessage,
  navigatorMessageType,
  navigatorPart,
  navigatorRead,
  practice,
  practiceMark,
  practiceNote,
  programStart,
  welcomeVideoSeen,
} from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import { navigatorDay, navigatorPosition, programDayNumber, weekDays, type NavigatorDay } from "../model/program-day";
import { listPractices } from "./program-content.server";

const PROGRAM_TIME_ZONE = "Europe/Minsk";

/** Сегодняшний день по Минску: «2026-12-25». */
export function programToday(now: Date): string {
  return localDay(now, PROGRAM_TIME_ZONE);
}

/** Первый день человека в программе. В первый раз — сегодня. */
async function startedOn(userId: string, today: string): Promise<string> {
  await db.insert(programStart).values({ userId, startedOn: today }).onConflictDoNothing();
  const [row] = await db.select().from(programStart).where(eq(programStart.userId, userId));
  return row.startedOn;
}

export type NavigatorToday = NavigatorDay & {
  messageId: string;
  masterName: string;
  read: boolean;
};

/** Послание человека на этот день программы: по порядку для его типа, по кругу. null — нет типа или посланий. */
async function navigatorFor(userId: string, programDay: number, today: string): Promise<NavigatorToday | null> {
  const type = await getMyCurrentType(userId);
  if (!type) return null;
  const messages = await db
    .select({ id: navigatorMessage.id, masterName: navigatorMessage.masterName, day7Task: navigatorMessage.day7Task })
    .from(navigatorMessage)
    .innerJoin(navigatorMessageType, eq(navigatorMessageType.messageId, navigatorMessage.id))
    .where(eq(navigatorMessageType.typeId, type.id))
    .orderBy(asc(navigatorMessage.position), asc(navigatorMessage.createdAt));
  if (messages.length === 0) return null;

  const { messageNumber, cycleDay } = navigatorPosition(programDay);
  const message = messages[messageNumber % messages.length];
  const [parts, [read]] = await Promise.all([
    db.select().from(navigatorPart).where(eq(navigatorPart.messageId, message.id)),
    db
      .select({ day: navigatorRead.day })
      .from(navigatorRead)
      .where(and(eq(navigatorRead.userId, userId), eq(navigatorRead.day, today))),
  ]);
  return {
    ...navigatorDay(parts, message.day7Task, cycleDay),
    messageId: message.id,
    masterName: message.masterName,
    read: Boolean(read),
  };
}

export type ProgramPractice = {
  id: string;
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
  /** Семь дней недели с понедельника: был ли в этот день хоть одна выполненная практика. */
  week: { day: string; done: boolean }[];
  /** Приветственное видео ещё не просмотрено — показать перед программой. */
  showWelcomeVideo: boolean;
};

/** Программа человека на сегодня. В первый раз запоминает его первый день. */
export async function getMyProgram(userId: string, now = new Date()): Promise<MyProgram> {
  const today = programToday(now);
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

  const open = practices.filter((item) => item.opensOnDay <= programDay);
  const view = (item: (typeof practices)[number]): ProgramPractice => ({
    id: item.id,
    title: item.title,
    daypart: item.daypart,
    hasVideo: Boolean(item.videoUrl),
    hasAudio: Boolean(item.audioPath),
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
    morning: open.filter((item) => item.daypart === "morning").map(view),
    evening: open.filter((item) => item.daypart === "evening").map(view),
    weekly: open.filter((item) => item.frequency === "weekly").map(view),
    week: days.map((day) => ({ day, done: doneDays.has(day) })),
    showWelcomeVideo: !welcome,
  };
}

/** Навигатор на сегодня для экрана послания. */
export async function getMyNavigator(userId: string, now = new Date()) {
  const today = programToday(now);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  return navigatorFor(userId, programDay, today);
}

/**
 * Отметить практику выполненной сегодня или снять отметку.
 * Ежедневная — одна отметка в день, еженедельная — одна в неделю. Закрытую практику отметить нельзя.
 */
export async function setPracticeDone(userId: string, practiceId: unknown, done: boolean, now = new Date()) {
  if (typeof practiceId !== "string") throw new AppError("not_found", "Практика не найдена");
  const today = programToday(now);
  const programDay = programDayNumber(await startedOn(userId, today), today);
  const [item] = await db.select().from(practice).where(eq(practice.id, practiceId));
  if (!item || item.opensOnDay > programDay) throw new AppError("not_found", "Практика не найдена");

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
  const today = programToday(now);
  const navigator = await getMyNavigator(userId, now);
  if (!navigator) throw new AppError("no_navigator", "Послание пока не готово");
  await db.insert(navigatorRead).values({ userId, day: today, messageId: navigator.messageId }).onConflictDoNothing();
  return { ok: true };
}

/** Заметка для себя к практике на сегодня. Пустая — удаляется. */
export async function saveMyNote(userId: string, practiceId: unknown, rawText: unknown, now = new Date()) {
  if (typeof practiceId !== "string") throw new AppError("not_found", "Практика не найдена");
  const today = programToday(now);
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
    .where(and(eq(practiceNote.userId, userId), eq(practiceNote.practiceId, practiceId), eq(practiceNote.day, programToday(now))));
  return { text: row?.text ?? "" };
}

/** Человек нажал «Просмотрено» у приветственного видео. */
export async function markWelcomeVideoSeen(userId: string) {
  await db.insert(welcomeVideoSeen).values({ userId }).onConflictDoNothing();
  return { ok: true };
}

