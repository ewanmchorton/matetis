import { describe, expect, it } from "vitest";

import { companionProgress, type CompanionProgressInput } from "./companion-progress";

/** Дни подряд, начиная с day. */
function days(day: string, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(`${day}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

// Металл 2026: с понедельника 2 ноября по воскресенье 29 ноября – ровно 4 недели.
const metal: Pick<CompanionProgressInput, "firstDay" | "lastDay"> = { firstDay: "2026-11-02", lastDay: "2026-11-29" };
const noWeekly = { weeklyDone: () => 0, weeklyAvailable: () => 0 };

describe("Прогресс спутника за стихию", () => {
  it("ничего не сделано – 0", () => {
    expect(companionProgress({ ...metal, activeDays: [], ...noWeekly })).toBe(0);
  });

  it("5 дней каждую неделю и все еженедельные практики – вся программа", () => {
    const active = [0, 7, 14, 21].flatMap((offset) => days("2026-11-02", 28).slice(offset, offset + 5));
    expect(companionProgress({ ...metal, activeDays: active, weeklyDone: () => 1, weeklyAvailable: () => 1 })).toBe(1);
  });

  it("каждый день без еженедельных – 0,7; больше 5 дней в неделю не прибавляет", () => {
    const everyDay = companionProgress({ ...metal, activeDays: days("2026-11-02", 28), weeklyDone: () => 0, weeklyAvailable: () => 2 });
    expect(everyDay).toBeCloseTo(0.7);
  });

  it("одна полная неделя из четырёх – четверть", () => {
    expect(companionProgress({ ...metal, activeDays: days("2026-11-02", 5), ...noWeekly })).toBeCloseTo(0.25);
  });

  it("половина еженедельных практик – половина недельной доли", () => {
    const progress = companionProgress({ ...metal, activeDays: [], weeklyDone: () => 1, weeklyAvailable: () => 2 });
    expect(progress).toBeCloseTo(0.15);
  });

  it("неполная неделя на краю: в ней 2 дня – хватает 2 дней практики", () => {
    // С субботы 28 ноября по воскресенье 29 ноября – одна неделя из двух дней.
    const progress = companionProgress({
      firstDay: "2026-11-28",
      lastDay: "2026-11-29",
      activeDays: ["2026-11-28", "2026-11-29"],
      ...noWeekly,
    });
    expect(progress).toBe(1);
  });

  it("отметки вне периода не считаются", () => {
    expect(companionProgress({ ...metal, activeDays: ["2026-10-30", "2026-12-01"], ...noWeekly })).toBe(0);
  });

  it("человек пришёл позже начала стихии – считаем с его первого дня", () => {
    const progress = companionProgress({ firstDay: "2026-11-16", lastDay: "2026-11-29", activeDays: days("2026-11-16", 5), ...noWeekly });
    expect(progress).toBeCloseTo(0.5);
  });
});
