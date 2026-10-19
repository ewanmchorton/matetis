import { describe, expect, it } from "vitest";

import { calculateBirthSquare, levelForCount, parseBirthDate, scoreElements } from "./calculate";

const today = new Date(2026, 9, 19);
const square = (birthDate: string) => calculateBirthSquare(birthDate, today);

describe("Квадрат Пифагора по дате рождения", () => {
  it("15.03.1988: рабочие числа 35, 8, 33, 6", () => {
    expect(square("1988-03-15").workingNumbers).toEqual([35, 8, 33, 6]);
  });

  it("15.03.1988: цифры даты и рабочих чисел посчитаны, нули пропущены", () => {
    expect(square("1988-03-15").digitCounts).toEqual({
      1: 2, 2: 0, 3: 4, 4: 0, 5: 2, 6: 1, 7: 0, 8: 3, 9: 1,
    });
  });

  it("день с нулём (05.07.1990): третье число — минус удвоенная пятёрка", () => {
    const result = square("1990-07-05");
    expect(result.workingNumbers).toEqual([31, 4, 21, 3]);
    expect(result.digitCounts).toEqual({ 1: 3, 2: 1, 3: 2, 4: 1, 5: 1, 6: 0, 7: 1, 8: 0, 9: 2 });
  });

  it("дата 2000-х считается так же, как остальные (21.11.2003)", () => {
    const result = square("2003-11-21");
    expect(result.workingNumbers).toEqual([10, 1, 6, 6]);
    expect(result.digitCounts).toEqual({ 1: 5, 2: 2, 3: 1, 4: 0, 5: 0, 6: 2, 7: 0, 8: 0, 9: 0 });
  });

  it("отрицательное третье число (09.01.2000): минус не считается цифрой", () => {
    const result = square("2000-01-09");
    expect(result.workingNumbers).toEqual([12, 3, -6, 6]);
    expect(result.digitCounts).toEqual({ 1: 2, 2: 2, 3: 1, 4: 0, 5: 0, 6: 2, 7: 0, 8: 0, 9: 1 });
  });

  it("второе и четвёртое числа — сумма цифр один раз, без сведения к одной цифре (29.12.1999)", () => {
    expect(square("1999-12-29").workingNumbers).toEqual([42, 6, 38, 11]);
  });
});

describe("Распределение по стихиям", () => {
  it("15.03.1988: Земля 5, Металл 1, Вода 2, Дерево 4, Огонь 1 — в порядке круга Усин", () => {
    expect(scoreElements(square("1988-03-15").digitCounts)).toEqual([
      { element: "earth", count: 5, level: "very_strong" },
      { element: "metal", count: 1, level: "present" },
      { element: "water", count: 2, level: "balanced" },
      { element: "wood", count: 4, level: "strong" },
      { element: "fire", count: 1, level: "present" },
    ]);
  });

  it("Земля — 2, 5, 8; Металл — 6, 7; Вода — 1; Дерево — 3, 4; Огонь — 9", () => {
    const counts = { 1: 1, 2: 10, 3: 100, 4: 1000, 5: 10000, 6: 100000, 7: 1000000, 8: 10000000, 9: 100000000 };
    expect(scoreElements(counts).map(({ element, count }) => [element, count])).toEqual([
      ["earth", 10010010],
      ["metal", 1100000],
      ["water", 1],
      ["wood", 1100],
      ["fire", 100000000],
    ]);
  });

  it("шкала: 0 отсутствует … 5 очень сильная, 6 и больше — перегрузка", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 9].map(levelForCount)).toEqual([
      "absent",
      "present",
      "balanced",
      "unbalanced",
      "strong",
      "very_strong",
      "overload",
      "overload",
    ]);
  });
});

describe("Проверка даты рождения", () => {
  it.each([
    ["несуществующая дата", "2001-02-30"],
    ["дата в будущем", "2026-10-20"],
    ["раньше 1900 года", "1899-12-31"],
    ["другой формат", "15.03.1988"],
    ["не строка", 19880315],
  ])("%s — ошибка", (_, value) => {
    expect(() => parseBirthDate(value, today)).toThrow("Укажите настоящую дату рождения");
  });

  it("сегодняшняя дата допустима", () => {
    expect(parseBirthDate("2026-10-19", today)).toEqual({ day: 19, month: 10, year: 2026 });
  });
});
