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

/** Что читают на 7-й день вместе с частями: заголовок, вступление, завершение и задание дня. */
export type NavigatorWhole = {
  title: string;
  intro: string;
  closing: string;
  day7Task: string | null;
};

/** Что в этот день навигатора: часть послания (дни 1–6) или послание полностью (7-й день). */
export type NavigatorDayKind = "part" | "full";

export type NavigatorDay = {
  cycleDay: number;
  kind: NavigatorDayKind;
  /** Заголовок на карточке программы: части, а на 7-й день — всего послания. */
  title: string;
  /** Какие части показать: в дни 1–6 одна, на 7-й день — все три. */
  parts: { title: string; body: string }[];
  /** Вступление и завершение послания — только на 7-й день. */
  intro: string | null;
  closing: string | null;
  /** Задание на сегодня. null — задания нет. */
  task: string | null;
  /** Второй день части со своим заданием: тот же текст, новое задание. */
  newTask: boolean;
};

/**
 * Что показывает навигатор в этот день недели послания.
 * Дни 1–2 — часть 1, 3–4 — часть 2, 5–6 — часть 3: в первый день части её задание первого дня,
 * во второй — задание второго дня; пока его нет — то же, что в первый.
 * День 7 — послание полностью: заголовок, вступление, все части, завершение и задание 7-го дня.
 */
export function navigatorDay(whole: NavigatorWhole, parts: NavigatorPart[], cycleDay: number): NavigatorDay {
  const sorted = [...parts].sort((a, b) => a.part - b.part);
  if (cycleDay >= NAVIGATOR_CYCLE_DAYS) {
    return {
      cycleDay,
      kind: "full",
      title: whole.title,
      parts: sorted.map(({ title, body }) => ({ title, body })),
      intro: whole.intro,
      closing: whole.closing,
      task: whole.day7Task?.trim() || null,
      newTask: false,
    };
  }
  const current = sorted[Math.ceil(cycleDay / 2) - 1] ?? sorted[0];
  const ownSecondTask = cycleDay % 2 === 0 ? current.secondDayTask?.trim() : undefined;
  return {
    cycleDay,
    kind: "part",
    title: current.title,
    parts: [{ title: current.title, body: current.body }],
    intro: null,
    closing: null,
    task: ownSecondTask || current.firstDayTask?.trim() || null,
    newTask: Boolean(ownSecondTask),
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
