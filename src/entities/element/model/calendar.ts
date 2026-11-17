import type { ElementId } from "./types";

// Календарь стихий по временам года, по Минску. Без обращений к базе.
// Зима – Вода, весна – Дерево, лето – Огонь. Осень начинается Землёй, с 1 ноября – Металл.
// День перехода на Металл каждый год разный: контент-менеджер может задать другой в админке.
// На границе стихий 5 дней до и 5 дней после смены – переход: для него свои фоны.

/** В Беларуси нет перехода на летнее время: всегда UTC+3. */
const MINSK_OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Сколько дней до и после смены стихии показывается фон перехода. */
export const TRANSITION_DAYS = 5;

/** Фон, который подходит этому дню: стихии или перехода между двумя стихиями. */
export type SeasonBackground = { kind: "element"; elementId: ElementId } | { kind: "transition"; from: ElementId; to: ElementId };

/** День Металла, если в админке другой не задан: 1 ноября. */
export function defaultMetalStart(year: number): Date {
  return minskMidnight(year, 11, 1);
}

/** Для какого года задаётся дата Металла: в декабре – уже для следующей осени. */
export function metalYearFor(now: Date): number {
  const { year, month } = minskYearMonth(now);
  return month === 12 ? year + 1 : year;
}

/** Год и месяц (1–12) по Минску. */
export function minskYearMonth(now: Date): { year: number; month: number } {
  const minsk = new Date(now.getTime() + MINSK_OFFSET_MS);
  return { year: minsk.getUTCFullYear(), month: minsk.getUTCMonth() + 1 };
}

/** Полночь по Минску в этот день. month – 1–12. */
export function minskMidnight(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day) - MINSK_OFFSET_MS);
}

/** Стихия в этот момент. metalFrom – с какого момента в этом году Металл. */
export function elementAt(now: Date, metalFrom: Date): ElementId {
  const { month } = minskYearMonth(now);
  if (month === 12 || month <= 2) return "water";
  if (month <= 5) return "wood";
  if (month <= 8) return "fire";
  return now >= metalFrom ? "metal" : "earth";
}

/** Смены стихий вокруг этого момента: прошлый, этот и следующий год. */
function boundaries(now: Date, metalFrom: (year: number) => Date) {
  const { year } = minskYearMonth(now);
  return [year - 1, year, year + 1].flatMap((y) => {
    return [
      { at: minskMidnight(y, 3, 1), from: "water", to: "wood" },
      { at: minskMidnight(y, 6, 1), from: "wood", to: "fire" },
      { at: minskMidnight(y, 9, 1), from: "fire", to: "earth" },
      { at: metalFrom(y), from: "earth", to: "metal" },
      { at: minskMidnight(y, 12, 1), from: "metal", to: "water" },
    ] as { at: Date; from: ElementId; to: ElementId }[];
  });
}

/** Период стихии, в котором этот момент: с какого момента и до какого (не включительно). */
export function seasonPeriodAt(now: Date, metalFrom: (year: number) => Date): { elementId: ElementId; from: Date; to: Date } {
  const sorted = boundaries(now, metalFrom).sort((a, b) => a.at.getTime() - b.at.getTime());
  const next = sorted.findIndex((boundary) => boundary.at > now);
  return { elementId: sorted[next].from, from: sorted[next - 1].at, to: sorted[next].at };
}

/** День по Минску для момента: «2026-11-01». */
export function minskDay(moment: Date): string {
  return new Date(moment.getTime() + MINSK_OFFSET_MS).toISOString().slice(0, 10);
}

/**
 * Какой фон показывать в этот момент. Ближе 5 дней к смене стихии – фон перехода,
 * иначе – фон текущей стихии. metalFrom(year) – день Металла в этом году.
 */
export function backgroundAt(now: Date, metalFrom: (year: number) => Date): SeasonBackground {
  const nearest = boundaries(now, metalFrom)
    .map((boundary) => ({ ...boundary, distance: Math.abs(now.getTime() - boundary.at.getTime()) }))
    .sort((a, b) => a.distance - b.distance)[0];
  const edge = now >= nearest.at ? nearest.distance < TRANSITION_DAYS * DAY_MS : nearest.distance <= TRANSITION_DAYS * DAY_MS;
  if (edge) return { kind: "transition", from: nearest.from, to: nearest.to };
  return { kind: "element", elementId: elementAt(now, metalFrom(minskYearMonth(now).year)) };
}

/**
 * Показывать ли в админке настройку дня Металла: с 1 октября до недели после перехода.
 * Остальной год она не нужна.
 */
export function isMetalSettingVisible(now: Date, metalFrom: Date): boolean {
  const { year } = minskYearMonth(now);
  return now >= minskMidnight(year, 10, 1) && now.getTime() < metalFrom.getTime() + 7 * DAY_MS;
}

/** Дата Металла подходит, только если она осенью: со 2 сентября по 30 ноября. */
export function isMetalDateAllowed(month: number, day: number): boolean {
  if (month === 9) return day >= 2;
  return month === 10 || month === 11;
}
