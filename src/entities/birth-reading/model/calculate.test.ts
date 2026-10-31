import { describe, expect, it } from "vitest";

import { calculateBirthSquare, levelForCount, parseBirthDate, scoreElements, weakElements, type ElementScore } from "./calculate";

const today = new Date(2026, 9, 19);
const square = (birthDate: string) => calculateBirthSquare(birthDate, today);

describe("Квадрат Пифагора по дате рождения", () => {
  it("18.06.1990: рабочие числа 34, 7, 32, 5", () => {
    expect(square("1990-06-18").workingNumbers).toEqual([34, 7, 32, 5]);
  });

  it("18.06.1990: цифры даты и рабочих чисел посчитаны вместе с нулями", () => {
    expect(square("1990-06-18").digitCounts).toEqual({
      0: 2, 1: 2, 2: 1, 3: 2, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 2,
    });
  });

  it("15.03.1988: рабочие числа 35, 8, 33, 6, ноль из месяца «03» посчитан", () => {
    const result = square("1988-03-15");
    expect(result.workingNumbers).toEqual([35, 8, 33, 6]);
    expect(result.digitCounts).toEqual({ 0: 1, 1: 2, 2: 0, 3: 4, 4: 0, 5: 2, 6: 1, 7: 0, 8: 3, 9: 1 });
  });

  it("день с нулём (05.07.1990): третье число — минус удвоенная пятёрка, нули дня и месяца считаются", () => {
    const result = square("1990-07-05");
    expect(result.workingNumbers).toEqual([31, 4, 21, 3]);
    expect(result.digitCounts).toEqual({ 0: 3, 1: 3, 2: 1, 3: 2, 4: 1, 5: 1, 6: 0, 7: 1, 8: 0, 9: 2 });
  });

  it("дата 2000-х считается так же, как остальные (21.11.2003)", () => {
    const result = square("2003-11-21");
    expect(result.workingNumbers).toEqual([10, 1, 6, 6]);
    expect(result.digitCounts).toEqual({ 0: 3, 1: 5, 2: 2, 3: 1, 4: 0, 5: 0, 6: 2, 7: 0, 8: 0, 9: 0 });
  });

  it("отрицательное третье число (09.01.2000): минус не считается цифрой", () => {
    const result = square("2000-01-09");
    expect(result.workingNumbers).toEqual([12, 3, -6, 6]);
    expect(result.digitCounts).toEqual({ 0: 5, 1: 2, 2: 2, 3: 1, 4: 0, 5: 0, 6: 2, 7: 0, 8: 0, 9: 1 });
  });

  it("второе и четвёртое числа — сумма цифр один раз, без сведения к одной цифре (29.12.1999)", () => {
    expect(square("1999-12-29").workingNumbers).toEqual([42, 6, 38, 11]);
  });
});

describe("Распределение по стихиям", () => {
  it("18.06.1990: Земля 3, Металл 3, Вода 3, Дерево 3, Огонь 2 — в порядке круга Усин", () => {
    expect(scoreElements(square("1990-06-18").digitCounts)).toEqual([
      { element: "earth", count: 3, level: "unbalanced" },
      { element: "metal", count: 3, level: "unbalanced" },
      { element: "water", count: 3, level: "unbalanced" },
      { element: "wood", count: 3, level: "unbalanced" },
      { element: "fire", count: 2, level: "balanced" },
    ]);
  });

  it("Земля — 3, 5; Металл — 2, 9; Вода — 1, 6; Дерево — 0, 8; Огонь — 4, 7", () => {
    const counts = {
      0: 1, 1: 10, 2: 100, 3: 1000, 4: 10000, 5: 100000, 6: 1000000, 7: 10000000, 8: 100000000, 9: 1000000000,
    };
    expect(scoreElements(counts).map(({ element, count }) => [element, count])).toEqual([
      ["earth", 101000],
      ["metal", 1000000100],
      ["water", 1000010],
      ["wood", 100000001],
      ["fire", 10010000],
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

/** Стихии с заданным числом цифр, в порядке круга от Земли: Земля, Металл, Вода, Дерево, Огонь. */
function scores(earth: number, metal: number, water: number, wood: number, fire: number): ElementScore[] {
  const counts = { earth, metal, water, wood, fire };
  return (Object.keys(counts) as (keyof typeof counts)[]).map((element) => ({
    element,
    count: counts[element],
    level: levelForCount(counts[element]),
  }));
}

describe("Слабые стихии", () => {
  it("слабые — где 0 или 1 цифра (15.03.1988: Металл 1, Огонь 0)", () => {
    expect(weakElements(scoreElements(square("1988-03-15").digitCounts))).toEqual(["metal", "fire"]);
  });

  it("нет 0 и 1 — берём тройки (18.06.1990: Земля, Металл, Вода, Дерево)", () => {
    expect(weakElements(scoreElements(square("1990-06-18").digitCounts))).toEqual(["earth", "metal", "water", "wood"]);
  });

  it("есть и единица, и тройки — слабая только единица", () => {
    expect(weakElements(scores(3, 3, 1, 4, 3))).toEqual(["water"]);
  });

  it("нет 0, 1 и 3 — берём 5 и больше", () => {
    expect(weakElements(scores(5, 2, 2, 4, 6))).toEqual(["earth", "fire"]);
  });

  it("остались только 2 и 4 — берём двойки", () => {
    expect(weakElements(scores(4, 2, 2, 2, 4))).toEqual(["metal", "water", "wood"]);
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
