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

/** Что в этот день навигатора: часть послания, послание целиком (5-й день) или послание старцев (6-й и 7-й). */
export type NavigatorDayKind = "part" | "full" | "elders";

export type NavigatorDay = {
  cycleDay: number;
  kind: NavigatorDayKind;
  /** Какие части показать: в дни 1–4 одна, на 5-й день — обе. В дни старцев — пусто, текст берётся у старцев. */
  parts: { title: string; body: string }[];
  /** Задание на сегодня. null — задания нет. */
  task: string | null;
  /** Второй день части или 7-й день: тот же текст, новое задание. */
  newTask: boolean;
};

/**
 * Что показывает навигатор в этот день недели послания.
 * Дни 1–2 — часть 1, 3–4 — часть 2: в нечётный день задание первого дня части, в чётный — второго.
 * Пустые задания второй части берутся из первой. День 5 — послание целиком и своё задание.
 * Дни 6 и 7 — послание старцев, задания — как в 1-й и 2-й день.
 */
export function navigatorDay(parts: NavigatorPart[], day5Task: string | null, cycleDay: number): NavigatorDay {
  const sorted = [...parts].sort((a, b) => a.part - b.part);
  const first = sorted[0];
  if (cycleDay === 5) {
    return {
      cycleDay,
      kind: "full",
      parts: sorted.map(({ title, body }) => ({ title, body })),
      task: day5Task?.trim() || null,
      newTask: false,
    };
  }
  if (cycleDay >= 6) {
    const secondDay = cycleDay === 7;
    const task = secondDay ? first.secondDayTask?.trim() : first.firstDayTask?.trim();
    return { cycleDay, kind: "elders", parts: [], task: task || null, newTask: secondDay };
  }
  const current = sorted[Math.ceil(cycleDay / 2) - 1] ?? first;
  const secondDay = cycleDay % 2 === 0;
  const task = secondDay
    ? current.secondDayTask?.trim() || first.secondDayTask?.trim()
    : current.firstDayTask?.trim() || first.firstDayTask?.trim();
  return {
    cycleDay,
    kind: "part",
    parts: [{ title: current.title, body: current.body }],
    task: task || null,
    newTask: secondDay,
  };
}

/** С какого дня программы медитации чередуются по неделям. */
export const ALTERNATION_FROM_DAY = 15;

export type Alternation = "first" | "second" | null;

/** Неделя программы: дни 1–7 — первая. */
export function programWeek(programDay: number): number {
  return Math.floor((programDay - 1) / 7) + 1;
}

/**
 * Есть ли практика в программе в эту неделю. До 15-го дня — с недели, где она появляется.
 * С 15-го дня «first» стоит в 3-ю, 5-ю… неделю, «second» — в 4-ю, 6-ю…
 */
export function shownInWeek(week: number, opensOnDay: number, alternation: Alternation): boolean {
  if (week < programWeek(opensOnDay)) return false;
  const alternationWeek = programWeek(ALTERNATION_FROM_DAY);
  if (!alternation || week < alternationWeek) return true;
  const firstOfPair = (week - alternationWeek) % 2 === 0;
  return alternation === "first" ? firstOfPair : !firstOfPair;
}

/** Сколько недель практика уже была в программе до этой: номер варианта, если вариант каждую неделю новый. */
export function weeksShownBefore(week: number, opensOnDay: number, alternation: Alternation): number {
  let count = 0;
  for (let earlier = 1; earlier < week; earlier += 1) {
    if (shownInWeek(earlier, opensOnDay, alternation)) count += 1;
  }
  return count;
}
