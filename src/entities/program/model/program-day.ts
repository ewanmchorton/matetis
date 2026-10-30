// Дни программы и цикл навигатора. Без обращений к базе.
// Дни считаются от первого дня человека в программе: первый день — 1.

const DAY_MS = 24 * 60 * 60 * 1000;

/** Сколько дней длится одно послание навигатора. */
export const NAVIGATOR_CYCLE_DAYS = 7;

/** «2026-12-25» → номер дня от 1970 года, чтобы считать разницу дней. */
function dayNumber(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, date) / DAY_MS);
}

/** Какой сегодня день программы: в первый день — 1. */
export function programDayNumber(startedOn: string, today: string): number {
  return Math.max(1, dayNumber(today) - dayNumber(startedOn) + 1);
}

/** Понедельник недели, в которую входит день: «2026-12-25» → «2026-12-21». */
export function weekStart(day: string): string {
  const number = dayNumber(day);
  // 1 января 1970 — четверг: сдвигаем так, чтобы понедельник был 0.
  const monday = number - ((number + 3) % 7);
  return new Date(monday * DAY_MS).toISOString().slice(0, 10);
}

/** Семь дней недели с понедельника. */
export function weekDays(day: string): string[] {
  const monday = dayNumber(weekStart(day));
  return Array.from({ length: 7 }, (_, index) => new Date((monday + index) * DAY_MS).toISOString().slice(0, 10));
}

/** Какое по счёту послание (с 0) и какой день его недели (1–7) в этот день программы. */
export function navigatorPosition(programDay: number) {
  return {
    messageNumber: Math.floor((programDay - 1) / NAVIGATOR_CYCLE_DAYS),
    cycleDay: ((programDay - 1) % NAVIGATOR_CYCLE_DAYS) + 1,
  };
}

export type NavigatorPart = {
  part: number;
  title: string;
  body: string;
  firstDayTask: string | null;
  secondDayTask: string | null;
};

export type NavigatorDay = {
  cycleDay: number;
  /** Какие части показать: в дни 1–6 одна, в седьмой день — все три. */
  parts: { title: string; body: string }[];
  /** Задание на сегодня. null — задания нет. */
  task: string | null;
  /** Второй день части: тот же текст, новое задание. */
  newTask: boolean;
  /** Седьмой день: послание полностью. */
  fullMessage: boolean;
};

/**
 * Что показывает навигатор в этот день недели послания.
 * Дни 1–2 — часть 1, 3–4 — часть 2, 5–6 — часть 3, в нечётный день задание первого дня части,
 * в чётный — второго. Пустые задания второй и третьей части берутся из первой. День 7 — всё послание.
 */
export function navigatorDay(parts: NavigatorPart[], day7Task: string | null, cycleDay: number): NavigatorDay {
  const sorted = [...parts].sort((a, b) => a.part - b.part);
  if (cycleDay >= NAVIGATOR_CYCLE_DAYS) {
    return {
      cycleDay,
      parts: sorted.map(({ title, body }) => ({ title, body })),
      task: day7Task?.trim() || null,
      newTask: false,
      fullMessage: true,
    };
  }
  const current = sorted[Math.ceil(cycleDay / 2) - 1] ?? sorted[0];
  const first = sorted[0];
  const secondDay = cycleDay % 2 === 0;
  const task = secondDay
    ? current.secondDayTask?.trim() || first.secondDayTask?.trim()
    : current.firstDayTask?.trim() || first.firstDayTask?.trim();
  return {
    cycleDay,
    parts: [{ title: current.title, body: current.body }],
    task: task || null,
    newTask: secondDay,
    fullMessage: false,
  };
}
