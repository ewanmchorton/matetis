import { addDays, getWeekStartKey, toDateKey } from "@/shared/lib/date";

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

const BADGE_THRESHOLD = 0.7;
/** Сколько дней текущего периода берём в прототипе, чтобы процент был виден сразу. */
const PARTICIPATION_DAYS = 14;

export type BadgeRitual = { id: string; schedule: "daily" | "once_per_week" };

/**
 * Процент бейджа стихии: уникальные выполнения практики дня и ритуалов
 * делим на запланированные за период участия.
 * Повтор в тот же день не увеличивает счёт. Библиотека сюда не входит.
 * Бейдж начисляется в конце периода, если процент не ниже 70.
 */
export function getElementBadgeProgress(
  completedPractices: string[],
  ritualMarks: Record<string, string[]>,
  rituals: BadgeRitual[],
  today: Date,
) {
  const start = addDays(today, -(PARTICIPATION_DAYS - 1));
  const dayKeys = Array.from({ length: PARTICIPATION_DAYS }, (_, i) => toDateKey(addDays(start, i)));
  const daySet = new Set(dayKeys);
  const weekKeys = [...new Set(dayKeys.map((key) => getWeekStartKey(parseDateKey(key))))];

  let planned = PARTICIPATION_DAYS;
  let done = completedPractices.filter((key) => daySet.has(key)).length;

  for (const ritual of rituals) {
    const marks = ritualMarks[ritual.id] ?? [];
    if (ritual.schedule === "daily") {
      planned += PARTICIPATION_DAYS;
      done += marks.filter((key) => daySet.has(key)).length;
    } else {
      planned += weekKeys.length;
      const weekSet = new Set(weekKeys);
      done += marks.filter((key) => weekSet.has(key)).length;
    }
  }

  const ratio = planned === 0 ? 0 : done / planned;
  return {
    done,
    planned,
    percent: Math.round(ratio * 100),
    earnsBadge: ratio >= BADGE_THRESHOLD,
    thresholdPercent: 70,
  };
}

function parseDateKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
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
