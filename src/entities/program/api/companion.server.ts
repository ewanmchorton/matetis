// Спутник «Гармония»: состояние по отметкам за период стихии и экраны превращения. Только серверный код.
// Состояние не хранится – считается из отметок. Хранится только, какое состояние человек уже видел.
import { and, eq, gte, inArray, lte } from "drizzle-orm";

import {
  stageForProgress,
  type CompanionScreen,
  type CompanionStage,
  type TransitionStage,
} from "@/entities/companion";
import { getCurrentSeasonPeriod, type SeasonPeriod } from "@/entities/element/server";
import { companionSeen, db, navigatorRead, practiceMark, programStart } from "@/shared/db";

import { companionProgress } from "../model/companion-progress";
import { programDayNumber, weekStart } from "../model/program-day";
import { personFor, todayFor, visiblePractices } from "./my-program.server";
import { listPractices, type Practice } from "./program-content.server";

/** Год, в котором начался период стихии: зима с декабря – год декабря. */
const seasonYear = (period: SeasonPeriod) => Number(period.firstDay.slice(0, 4));

async function startedOnOf(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const rows = await db.select().from(programStart).where(inArray(programStart.userId, userIds));
  return new Map(rows.map((row) => [row.userId, row.startedOn]));
}

/** Состояние спутника человека в текущий период стихии. Не начал программу – первое. */
async function stageOf(
  userId: string,
  startedOn: string | undefined,
  period: SeasonPeriod,
  practices: Practice[],
  now: Date,
): Promise<CompanionStage> {
  if (!startedOn) return 1;
  const today = await todayFor(userId, now);
  const firstDay = startedOn > period.firstDay ? startedOn : period.firstDay;
  const lastDay = period.lastDay;
  if (today < firstDay) return 1;
  const upTo = today < lastDay ? today : lastDay;

  const [marks, reads, person] = await Promise.all([
    db
      .select({ practiceId: practiceMark.practiceId, day: practiceMark.day })
      .from(practiceMark)
      .where(and(eq(practiceMark.userId, userId), gte(practiceMark.day, firstDay), lte(practiceMark.day, upTo))),
    db
      .select({ day: navigatorRead.day })
      .from(navigatorRead)
      .where(and(eq(navigatorRead.userId, userId), gte(navigatorRead.day, firstDay), lte(navigatorRead.day, upTo))),
    personFor(userId, period),
  ]);

  const weekly = new Set(practices.filter((item) => item.frequency === "weekly").map((item) => item.id));
  const weeklyDone = new Map<string, Set<string>>();
  for (const mark of marks.filter((item) => weekly.has(item.practiceId))) {
    const monday = weekStart(mark.day);
    weeklyDone.set(monday, (weeklyDone.get(monday) ?? new Set()).add(mark.practiceId));
  }

  const progress = companionProgress({
    firstDay,
    lastDay,
    activeDays: [...marks, ...reads].map((item) => item.day),
    weeklyDone: (monday) => weeklyDone.get(monday)?.size ?? 0,
    weeklyAvailable: (monday) => {
      // Какие еженедельные практики были у человека на этой неделе: по дню программы её понедельника.
      const day = monday > firstDay ? monday : firstDay;
      return visiblePractices(practices, person, programDayNumber(startedOn, day)).filter(
        ({ item }) => item.frequency === "weekly",
      ).length;
    },
  });
  return stageForProgress(progress);
}

/** Состояния спутников нескольких людей – для списка друзей. */
export async function getCompanionStages(userIds: string[], now = new Date()): Promise<Map<string, CompanionStage>> {
  if (userIds.length === 0) return new Map();
  const [period, practices, started] = await Promise.all([
    getCurrentSeasonPeriod(now),
    listPractices(),
    startedOnOf(userIds),
  ]);
  const stages = await Promise.all(
    userIds.map((id) => stageOf(id, started.get(id), period, practices, now)),
  );
  return new Map(userIds.map((id, index) => [id, stages[index]]));
}

export async function getCompanionStage(userId: string, now = new Date()): Promise<CompanionStage> {
  return (await getCompanionStages([userId], now)).get(userId) ?? 1;
}

export type MyCompanion = {
  stage: CompanionStage;
  /** Какой экран показать поверх программы. null – никакой. */
  screen: CompanionScreen | null;
};

async function seenStage(userId: string, period: SeasonPeriod) {
  const [row] = await db
    .select({ stage: companionSeen.stage })
    .from(companionSeen)
    .where(
      and(
        eq(companionSeen.userId, userId),
        eq(companionSeen.element, period.elementId),
        eq(companionSeen.seasonYear, seasonYear(period)),
      ),
    );
  return row?.stage ?? null;
}

/**
 * Мой спутник и экран, который пора показать.
 * Человек был в программе до начала стихии и ещё не видел её экрана – «Новая стихия».
 * Спутник вырос с прошлого просмотра – превращение сразу в нынешнее состояние.
 */
export async function getMyCompanion(userId: string, now = new Date()): Promise<MyCompanion> {
  const [period, practices, started] = await Promise.all([
    getCurrentSeasonPeriod(now),
    listPractices(),
    startedOnOf([userId]),
  ]);
  const startedOn = started.get(userId);
  const [stage, seen] = await Promise.all([
    stageOf(userId, startedOn, period, practices, now),
    seenStage(userId, period),
  ]);
  if (seen === null && startedOn && startedOn < period.firstDay) {
    return { stage, screen: { kind: "new-period", elementId: period.elementId } };
  }
  const from = (seen ?? 1) as CompanionStage;
  return { stage, screen: stage > from ? { kind: "transition", from, to: stage as TransitionStage } : null };
}

/** Человек нажал «Дальше» на экране спутника: этот экран больше не показываем. */
export async function markMyCompanionSeen(userId: string, now = new Date()) {
  const { stage, screen } = await getMyCompanion(userId, now);
  if (!screen) return { ok: true };
  const period = await getCurrentSeasonPeriod(now);
  const seen = screen.kind === "new-period" ? 1 : stage;
  await db
    .insert(companionSeen)
    .values({ userId, element: period.elementId, seasonYear: seasonYear(period), stage: seen })
    .onConflictDoUpdate({
      target: [companionSeen.userId, companionSeen.element, companionSeen.seasonYear],
      set: { stage: seen, seenAt: now },
    });
  return { ok: true };
}
