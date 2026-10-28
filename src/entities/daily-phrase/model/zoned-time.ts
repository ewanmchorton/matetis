// Время по часам телефона человека. Без обращений к базе.
// Часовой пояс — название из базы часовых поясов («Europe/Minsk»), его сообщает телефон.

export const DEFAULT_TIME_ZONE = "Europe/Minsk";

type LocalParts = { year: number; month: number; day: number; hour: number; minute: number; second: number };

function localParts(moment: Date, timeZone: string): LocalParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
  }).formatToParts(moment);
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
  };
}

/** Сегодняшний день по часам человека: «2026-12-25». */
export function localDay(moment: Date, timeZone: string): string {
  const { year, month, day } = localParts(moment, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/** На сколько мс часы в этом поясе впереди UTC в этот момент. */
function offsetMs(moment: Date, timeZone: string): number {
  const p = localParts(moment, timeZone);
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
  return asUtc - Math.floor(moment.getTime() / 1000) * 1000;
}

/**
 * Момент, когда у человека на часах наступает hour:00 в день day («2026-12-25»).
 * hour = 24 — полночь следующего дня.
 */
export function localHourToMoment(day: string, hour: number, timeZone: string): Date {
  const [year, month, date] = day.split("-").map(Number);
  const guess = Date.UTC(year, month - 1, date, hour);
  // Сдвиг пояса берём в найденный момент ещё раз: так верно и в дни перехода на летнее время.
  const first = guess - offsetMs(new Date(guess), timeZone);
  return new Date(guess - offsetMs(new Date(first), timeZone));
}
