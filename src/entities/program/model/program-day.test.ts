import { describe, expect, it } from "vitest";

import {
  navigatorDay,
  navigatorPosition,
  programDayNumber,
  programWeek,
  shownInWeek,
  weekDays,
  weeksShownBefore,
  weekStart,
  type NavigatorPart,
} from "./program-day";

const parts: NavigatorPart[] = [
  { part: 1, title: "Часть 1", body: "Текст 1", firstDayTask: "Задание А", secondDayTask: "Задание Б" },
  { part: 2, title: "Часть 2", body: "Текст 2", firstDayTask: null, secondDayTask: null },
  { part: 3, title: "Часть 3", body: "Текст 3", firstDayTask: "Своё задание 5-го дня", secondDayTask: null },
];

describe("День программы", () => {
  it("в первый день — 1, через неделю — 8", () => {
    expect(programDayNumber("2026-12-25", "2026-12-25")).toBe(1);
    expect(programDayNumber("2026-12-25", "2027-01-01")).toBe(8);
  });

  it("неделя начинается с понедельника", () => {
    expect(weekStart("2026-12-25")).toBe("2026-12-21");
    expect(weekStart("2026-12-21")).toBe("2026-12-21");
    expect(weekStart("2026-12-27")).toBe("2026-12-21");
    expect(weekDays("2026-12-25")).toEqual([
      "2026-12-21",
      "2026-12-22",
      "2026-12-23",
      "2026-12-24",
      "2026-12-25",
      "2026-12-26",
      "2026-12-27",
    ]);
  });
});

describe("Цикл навигатора", () => {
  it("одно послание на 7 дней, на 8-й день — следующее", () => {
    expect(navigatorPosition(1)).toEqual({ messageNumber: 0, cycleDay: 1 });
    expect(navigatorPosition(7)).toEqual({ messageNumber: 0, cycleDay: 7 });
    expect(navigatorPosition(8)).toEqual({ messageNumber: 1, cycleDay: 1 });
  });

  it("дни 1–2 — первая часть: в первый день задание первого дня, во второй — новое задание", () => {
    expect(navigatorDay(parts, null, 1)).toMatchObject({ parts: [{ title: "Часть 1" }], task: "Задание А", newTask: false });
    expect(navigatorDay(parts, null, 2)).toMatchObject({ parts: [{ title: "Часть 1" }], task: "Задание Б", newTask: true });
  });

  it("задания второй части по умолчанию повторяют задания первой", () => {
    expect(navigatorDay(parts, null, 3)).toMatchObject({ parts: [{ title: "Часть 2" }], task: "Задание А" });
    expect(navigatorDay(parts, null, 4)).toMatchObject({ parts: [{ title: "Часть 2" }], task: "Задание Б" });
  });

  it("своё задание части заменяет повтор", () => {
    expect(navigatorDay(parts, null, 5).task).toBe("Своё задание 5-го дня");
    expect(navigatorDay(parts, null, 6).task).toBe("Задание Б");
  });

  it("на седьмой день — всё послание и задание седьмого дня, если есть", () => {
    const day7 = navigatorDay(parts, "Задание недели", 7);
    expect(day7.parts.map((part) => part.title)).toEqual(["Часть 1", "Часть 2", "Часть 3"]);
    expect(day7).toMatchObject({ task: "Задание недели", fullMessage: true, newTask: false });
    expect(navigatorDay(parts, null, 7).task).toBeNull();
  });
});

describe("Недели программы и чередование", () => {
  it("дни 1–7 — первая неделя, 8-й день — вторая", () => {
    expect([1, 7, 8, 15].map(programWeek)).toEqual([1, 1, 2, 3]);
  });

  it("без чередования практика есть каждую неделю с недели, где она появилась", () => {
    expect([1, 2, 3, 4].map((week) => shownInWeek(week, 8, null))).toEqual([false, true, true, true]);
  });

  it("с 15-го дня «first» — в 3-ю и 5-ю неделю, «second» — в 4-ю и 6-ю", () => {
    expect([1, 2, 3, 4, 5, 6].map((week) => shownInWeek(week, 1, "first"))).toEqual([true, true, true, false, true, false]);
    expect([1, 2, 3, 4, 5, 6].map((week) => shownInWeek(week, 8, "second"))).toEqual([false, true, false, true, false, true]);
  });

  it("номер варианта — сколько недель практика уже была", () => {
    expect([1, 3, 5].map((week) => weeksShownBefore(week, 1, "first"))).toEqual([0, 2, 3]);
    expect([2, 4, 6].map((week) => weeksShownBefore(week, 8, "second"))).toEqual([0, 1, 2]);
  });
});
