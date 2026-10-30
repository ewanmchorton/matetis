// Текущая стихия, фон для экранов и день перехода осенью с Земли на Металл. Только серверный код.
import { eq, inArray } from "drizzle-orm";

import { assertStaff } from "@/shared/auth/assert-admin";
import { db, metalStart } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import {
  backgroundAt,
  defaultMetalStart,
  elementAt,
  isMetalDateAllowed,
  isMetalSettingVisible,
  metalYearFor,
  minskMidnight,
  minskYearMonth,
  type SeasonBackground,
} from "../model/calendar";
import type { ElementId } from "../model/types";

/** Даты Металла за эти годы: «2026-10-14» → полночь по Минску. */
async function metalDates(years: number[]): Promise<Map<number, Date>> {
  const rows = await db.select().from(metalStart).where(inArray(metalStart.year, years));
  return new Map(rows.map((row) => [row.year, dayToMoment(row.startsOn)]));
}

function dayToMoment(day: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  return minskMidnight(year, month, date);
}

export type Season = {
  elementId: ElementId;
  /** Какой фон показывать: стихии или перехода. */
  background: SeasonBackground;
};

/** Стихия и фон в этот момент. */
export async function getCurrentSeason(now = new Date()): Promise<Season> {
  const { year } = minskYearMonth(now);
  const metal = await metalDates([year - 1, year, year + 1]);
  const metalFrom = (y: number) => metal.get(y) ?? defaultMetalStart(y);
  return { elementId: elementAt(now, metalFrom(year)), background: backgroundAt(now, metalFrom) };
}

export type ElementCalendarState = Season & {
  /** Для какой осени задаётся дата Металла. */
  metalYear: number;
  /** День Металла этой осенью, «2026-10-14». null — не задан, Металл с 1 ноября. */
  metalStartsOn: string | null;
  /** Показывать ли настройку дня Металла: с 1 октября до недели после перехода. */
  metalSettingVisible: boolean;
};

/** Для админки: текущая стихия, фон и день перехода на Металл. */
export async function getElementCalendarForStaff(viewerId: string, now = new Date()): Promise<ElementCalendarState> {
  await assertStaff(viewerId);
  const metalYear = metalYearFor(now);
  const [season, [row]] = await Promise.all([
    getCurrentSeason(now),
    db.select({ startsOn: metalStart.startsOn }).from(metalStart).where(eq(metalStart.year, metalYear)).limit(1),
  ]);
  const metalStartsOn = row?.startsOn ?? null;
  const metalFrom = metalStartsOn ? dayToMoment(metalStartsOn) : defaultMetalStart(metalYear);
  return { ...season, metalYear, metalStartsOn, metalSettingVisible: isMetalSettingVisible(now, metalFrom) };
}

/**
 * Задать день, с которого этой осенью идёт Металл («2026-10-14»), или вернуть 1 ноября (null).
 * Дату обычно знают примерно за неделю. Можно поправить, если переход сдвинулся.
 */
export async function setMetalStart(viewerId: string, day: unknown, now = new Date()) {
  await assertStaff(viewerId);
  const year = metalYearFor(now);
  if (day === null) {
    await db.delete(metalStart).where(eq(metalStart.year, year));
    return getElementCalendarForStaff(viewerId, now);
  }
  const match = typeof day === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(day) : null;
  const [dayYear, month, date] = match ? match.slice(1).map(Number) : [];
  if (!match || dayYear !== year || !isMetalDateAllowed(month, date)) {
    throw new AppError("invalid_metal_date", `Выберите день осени ${year} года: со 2 сентября по 30 ноября`);
  }
  const row = { year, startsOn: day as string, setBy: viewerId, updatedAt: now };
  await db.insert(metalStart).values(row).onConflictDoUpdate({ target: metalStart.year, set: row });
  return getElementCalendarForStaff(viewerId, now);
}
