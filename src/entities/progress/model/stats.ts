import { addDays, toDateKey } from "@/shared/lib/date";

const WINDOW_DAYS = 7;

/** Ключи последних n дней, включая сегодня. */
function lastDayKeys(today: Date, n: number): Set<string> {
  return new Set(Array.from({ length: n }, (_, i) => toDateKey(addDays(today, -i))));
}

export function countInLastDays(days: string[], today: Date, n = WINDOW_DAYS): number {
  const window = lastDayKeys(today, n);
  return days.filter((d) => window.has(d)).length;
}

/**
 * Отметки ритуалов за последние n дней. У недельных ритуалов ключ — понедельник
 * текущей недели, он всегда попадает в окно из 7 дней.
 */
export function countRitualMarksInLastDays(
  ritualMarks: Record<string, string[]>,
  today: Date,
  n = WINDOW_DAYS,
): number {
  return Object.values(ritualMarks).reduce((sum, marks) => sum + countInLastDays(marks, today, n), 0);
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function encouragement(practices: number): string {
  if (practices === 0) return "Когда будет удобно — отметьте практику дня.";
  if (practices === 1) return "Вы уже нашли время для себя — это хорошее начало.";
  if (practices <= 3) return "Спокойный, хороший ритм — так держать.";
  return "Вы уделяете практике много внимания — это заметно.";
}

/** Цифры и ободряющие слова для блока статистики на главной «Программа». */
export function getProgramStats(
  completedPractices: string[],
  ritualMarks: Record<string, string[]>,
  today: Date,
) {
  const practices = countInLastDays(completedPractices, today);
  const rituals = countRitualMarksInLastDays(ritualMarks, today);
  return {
    practices,
    rituals,
    total: completedPractices.length,
    encouragement: encouragement(practices),
  };
}
