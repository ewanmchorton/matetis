import { addDays, toDateKey } from "@/shared/lib/date";

/**
 * Сколько дней подряд выполнена практика. Если сегодня ещё не отмечено,
 * серия не прерывается — считаем от вчерашнего дня.
 */
export function getStreak(completedDays: string[], today: Date): number {
  const done = new Set(completedDays);
  let day = done.has(toDateKey(today)) ? today : addDays(today, -1);
  let streak = 0;
  while (done.has(toDateKey(day))) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}
