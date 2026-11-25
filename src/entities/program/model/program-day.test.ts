import { describe, expect, it } from "vitest";

import {
  chainPosition,
  navigatorDay,
  navigatorPosition,
  programDayNumber,
  programWeek,
  weekDays,
  weekStart,
  type NavigatorPart,
  type NavigatorWhole,
} from "./program-day";

const parts: NavigatorPart[] = [
  { part: 1, title: "Часть 1", body: "Текст 1", firstDayTask: "Задание 1", secondDayTask: "Задание 2" },
  { part: 2, title: "Часть 2", body: "Текст 2", firstDayTask: "Задание 3", secondDayTask: null },
  { part: 3, title: "Часть 3", body: "Текст 3", firstDayTask: "Задание 5", secondDayTask: "Задание 6" },
];

const whole: NavigatorWhole = { title: "Послание", intro: "Вступление", closing: "Завершение", day7Task: "Задание 7" };

describe("День программы", () => {
  it("в первый день – 1, через неделю – 8", () => {
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
  it("одно послание на 7 дней, на 8-й день – следующее", () => {
    expect(navigatorPosition(1)).toEqual({ messageNumber: 0, cycleDay: 1 });
    expect(navigatorPosition(7)).toEqual({ messageNumber: 0, cycleDay: 7 });
    expect(navigatorPosition(8)).toEqual({ messageNumber: 1, cycleDay: 1 });
  });

  it("по два дня на часть: в первый день задание первого дня, во второй – новое задание", () => {
    expect(navigatorDay(whole, parts, 1)).toMatchObject({ kind: "part", title: "Часть 1", task: "Задание 1", newTask: false });
    expect(navigatorDay(whole, parts, 2)).toMatchObject({ parts: [{ title: "Часть 1" }], task: "Задание 2", newTask: true });
    expect(navigatorDay(whole, parts, 3)).toMatchObject({ title: "Часть 2", task: "Задание 3" });
    expect(navigatorDay(whole, parts, 5)).toMatchObject({ title: "Часть 3", task: "Задание 5" });
    expect(navigatorDay(whole, parts, 6)).toMatchObject({ title: "Часть 3", task: "Задание 6", newTask: true });
  });

  it("пока задания второго дня нет – то же задание, что в первый день части", () => {
    expect(navigatorDay(whole, parts, 4)).toMatchObject({ title: "Часть 2", task: "Задание 3", newTask: false });
  });

  it("на 7-й день – послание полностью: заголовок, вступление, три части, завершение", () => {
    const day7 = navigatorDay(whole, parts, 7);
    expect(day7).toMatchObject({
      kind: "full",
      title: "Послание",
      intro: "Вступление",
      closing: "Завершение",
      task: "Задание 7",
      newTask: false,
    });
    expect(day7.parts.map((part) => part.title)).toEqual(["Часть 1", "Часть 2", "Часть 3"]);
    expect(navigatorDay({ ...whole, day7Task: null }, parts, 7).task).toBeNull();
  });
});

describe("Сколько недель показывать вариант", () => {
  it("дни 1–7 – первая неделя, 8-й день – вторая", () => {
    expect([1, 7, 8, 15].map(programWeek)).toEqual([1, 1, 2, 3]);
  });

  it("пусто – первый вариант на всю стихию", () => {
    expect(chainPosition([null, null], 0)).toEqual({ index: 0, into: 0 });
    expect(chainPosition([null, null], 10)).toEqual({ index: 0, into: 10 });
  });

  it("у вариантов свои недели, потом по кругу", () => {
    expect([0, 2, 3, 6, 7, 9].map((week) => chainPosition([3, 4], week).index)).toEqual([0, 0, 1, 1, 0, 0]);
  });

  it("пустая длительность дальше по списку – этот вариант до конца", () => {
    expect(chainPosition([3, null], 2).index).toBe(0);
    expect(chainPosition([3, null], 3)).toEqual({ index: 1, into: 0 });
    expect(chainPosition([3, null], 20).index).toBe(1);
  });
});
