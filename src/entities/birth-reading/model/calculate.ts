// Квадрат Пифагора по дате рождения и распределение цифр по стихиям.
// Методика описана в docs/elements-method.md. Здесь только расчёт, без базы.
import type { ElementId } from "@/entities/element";
import { AppError } from "@/shared/lib/app-error";

export type Digit = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

/** Сколько раз встречается каждая цифра 1–9. Нули не считаются. */
export type DigitCounts = Record<Digit, number>;

export const digits: readonly Digit[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/** Стихии в порядке круга Усин, начиная с Земли. */
export const elementOrder: readonly ElementId[] = ["earth", "metal", "water", "wood", "fire"];

/** Какие цифры относятся к стихии. По схеме Жанны, без деления на инь и ян. */
export const elementDigits: Record<ElementId, readonly Digit[]> = {
  earth: [2, 5, 8],
  metal: [6, 7],
  water: [1],
  wood: [3, 4],
  fire: [9],
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

function digitsOf(value: number): number[] {
  // Минус у третьего числа не цифра: для некоторых дат 2000-х оно получается отрицательным.
  return String(Math.abs(value)).split("").map(Number);
}

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

/** Квадрат Пифагора: рабочие числа и сколько раз встречается каждая цифра. */
export function calculateBirthSquare(birthDate: string, today?: Date): BirthSquare {
  const { day, month, year } = parseBirthDate(birthDate, today);
  const dayDigits = digitsOf(day);
  const dateDigits = [...dayDigits, ...digitsOf(month), ...digitsOf(year)];

  const first = sum(dateDigits);
  const second = sum(digitsOf(first));
  // Первая цифра дня; для дней 1–9 это сама цифра дня (ноль в «05» не считается).
  const third = first - 2 * dayDigits[0];
  const fourth = sum(digitsOf(third));
  const workingNumbers: BirthSquare["workingNumbers"] = [first, second, third, fourth];

  const digitCounts = Object.fromEntries(digits.map((digit) => [digit, 0])) as DigitCounts;
  for (const value of [...dateDigits, ...workingNumbers.flatMap(digitsOf)]) {
    if (value !== 0) digitCounts[value as Digit] += 1;
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
