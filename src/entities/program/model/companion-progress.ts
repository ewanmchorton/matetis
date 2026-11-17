// Сколько программы стихии пройдено – по нему растёт спутник. Без обращений к базе.
// Неделя – с понедельника, как буквы недели и еженедельные практики.
// За неделю: 5 дней с практикой – 0,7, еженедельные практики этой недели – 0,3.
// Неполная неделя на краю периода весит меньше и требует меньше дней: сколько в ней дней, но не больше 5.
import { weekDays, weekStart } from "./program-day";

const DAYS_FOR_FULL_WEEK = 5;
const DAILY_SHARE = 0.7;
const WEEKLY_SHARE = 0.3;

export type CompanionProgressInput = {
  /** С какого дня считаем: начало стихии или первый день человека в программе, если он пришёл позже. */
  firstDay: string;
  /** Последний день стихии. */
  lastDay: string;
  /** Дни, когда была хоть одна практика или прочитан навигатор. */
  activeDays: Iterable<string>;
  /** Сколько разных еженедельных практик отмечено за неделю: ключ – понедельник. */
  weeklyDone: (monday: string) => number;
  /** Сколько еженедельных практик было в программе на этой неделе. 0 – вся неделя на ежедневных. */
  weeklyAvailable: (monday: string) => number;
};

/** Доля пройденной программы стихии: от 0 до 1. */
export function companionProgress(input: CompanionProgressInput): number {
  const { firstDay, lastDay, weeklyDone, weeklyAvailable } = input;
  if (firstDay > lastDay) return 0;
  const active = new Set(input.activeDays);
  let score = 0;
  let weight = 0;

  for (let monday = weekStart(firstDay); monday <= lastDay; monday = nextMonday(monday)) {
    const days = weekDays(monday).filter((day) => day >= firstDay && day <= lastDay);
    const needed = Math.min(DAYS_FOR_FULL_WEEK, days.length);
    const daily = Math.min(days.filter((day) => active.has(day)).length, needed) / needed;
    const available = weeklyAvailable(monday);
    const week =
      available > 0 ? DAILY_SHARE * daily + WEEKLY_SHARE * (Math.min(weeklyDone(monday), available) / available) : daily;
    score += week * days.length;
    weight += days.length;
  }
  return score / weight;
}

function nextMonday(monday: string): string {
  const date = new Date(`${monday}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 7);
  return date.toISOString().slice(0, 10);
}
