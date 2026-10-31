// Квадрат Пифагора по дате рождения и распределение цифр по стихиям.
// Методика описана в docs/elements-method.md. Здесь только расчёт, без базы.
import type { ElementId } from "@/entities/element";
import { AppError } from "@/shared/lib/app-error";

export type Digit = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Сколько раз встречается каждая цифра 0–9. */
export type DigitCounts = Record<Digit, number>;

export const digits: readonly Digit[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Стихии в порядке круга Усин, начиная с Земли. */
export const elementOrder: readonly ElementId[] = ["earth", "metal", "water", "wood", "fire"];

/** Какие цифры относятся к стихии. По схеме Жанны «Концепция У-син в нумерологии», без деления на инь и ян. */
export const elementDigits: Record<ElementId, readonly Digit[]> = {
  earth: [3, 5],
  metal: [2, 9],
  water: [1, 6],
  wood: [0, 8],
  fire: [4, 7],
};

export type ElementLevel =
  | "absent"
  | "present"
  | "balanced"
  | "unbalanced"
  | "strong"
  | "very_strong"
  | "overload";

/** Оценка по количеству цифр стихии. Индекс — количество, 6 и больше — перегрузка. */
const levelsByCount: readonly ElementLevel[] = [
  "absent",
  "present",
  "balanced",
  "unbalanced",
  "strong",
  "very_strong",
  "overload",
];

export const elementLevelLabels: Record<ElementLevel, string> = {
  absent: "отсутствует",
  present: "наличие",
  balanced: "баланс",
  unbalanced: "разбалансирована",
  strong: "сильная",
  very_strong: "очень сильная",
  overload: "перегрузка",
};

export type ElementScore = {
  element: ElementId;
  /** Сколько цифр этой стихии в квадрате. */
  count: number;
  level: ElementLevel;
};

export type BirthSquare = {
  /** Четыре рабочих числа. */
  workingNumbers: [number, number, number, number];
  digitCounts: DigitCounts;
};

const EARLIEST_YEAR = 1900;

/** Проверяет дату вида ГГГГ-ММ-ДД: настоящая дата, не раньше 1900 года и не в будущем. */
export function parseBirthDate(value: unknown, today = new Date()): { day: number; month: number; year: number } {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  const invalid = new AppError("invalid_birth_date", "Укажите настоящую дату рождения");
  if (!match) throw invalid;

  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const asDate = new Date(Date.UTC(year, month - 1, day));
  const isRealDate =
    asDate.getUTCFullYear() === year && asDate.getUTCMonth() === month - 1 && asDate.getUTCDate() === day;
  const todayUtc = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  if (!isRealDate || year < EARLIEST_YEAR || asDate.getTime() > todayUtc) throw invalid;

  return { day, month, year };
}

function digitsOf(value: number | string): number[] {
  // Минус у третьего числа не цифра: для некоторых дат 2000-х оно получается отрицательным.
  return String(value).replace("-", "").split("").map(Number);
}

const twoDigits = (value: number) => String(value).padStart(2, "0");

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Квадрат Пифагора: рабочие числа и сколько раз встречается каждая цифра. */
export function calculateBirthSquare(birthDate: string, today?: Date): BirthSquare {
  const { day, month, year } = parseBirthDate(birthDate, today);
  // Дата как пишется — ДД.ММ.ГГГГ: ноль в «06» тоже цифра.
  const dateDigits = digitsOf(`${twoDigits(day)}${twoDigits(month)}${year}`);

  const first = sum(dateDigits);
  const second = sum(digitsOf(first));
  // Первая цифра дня; для дней 01–09 это сама цифра дня (ноль в «05» пропускаем).
  const third = first - 2 * digitsOf(day)[0];
  const fourth = sum(digitsOf(third));
  const workingNumbers: BirthSquare["workingNumbers"] = [first, second, third, fourth];

  const digitCounts = Object.fromEntries(digits.map((digit) => [digit, 0])) as DigitCounts;
  for (const value of [...dateDigits, ...workingNumbers.flatMap((number) => digitsOf(number))]) {
    digitCounts[value as Digit] += 1;
  }
  return { workingNumbers, digitCounts };
}

export function levelForCount(count: number): ElementLevel {
  return levelsByCount[Math.min(count, levelsByCount.length - 1)];
}

/** Распределение по стихиям в порядке круга Усин. */
export function scoreElements(digitCounts: DigitCounts): ElementScore[] {
  return elementOrder.map((element) => {
    const count = sum(elementDigits[element].map((digit) => digitCounts[digit]));
    return { element, count, level: levelForCount(count) };
  });
}

/**
 * Слабые стихии человека — для практик на слабую стихию. Правило Жанны от 31.10.2026, по порядку:
 * 0 или 1 цифра; если таких нет — ровно 3; если и таких нет — 5 и больше; остались только 2 и 4 — берём 2.
 * Порядок — по кругу Усин от Земли. Если слабых несколько, программа прокачивает их по очереди.
 */
export function weakElements(scores: ElementScore[]): ElementId[] {
  const rules: ((count: number) => boolean)[] = [
    (count) => count <= 1,
    (count) => count === 3,
    (count) => count >= 5,
    (count) => count === 2,
  ];
  for (const rule of rules) {
    const found = scores.filter((score) => rule(score.count)).map((score) => score.element);
    if (found.length > 0) return found;
  }
  return [];
}
