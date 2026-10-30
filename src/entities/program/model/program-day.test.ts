import { describe, expect, it } from "vitest";

import { navigatorDay, navigatorPosition, programDayNumber, weekDays, weekStart, type NavigatorPart } from "./program-day";

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
