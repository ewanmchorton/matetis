/** Дата в виде ключа «ГГГГ-ММ-ДД» по местному времени телефона. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

/** Семь дней текущей недели, с понедельника по воскресенье. */
export function getWeekDays(date: Date): Date[] {
  const mondayOffset = (date.getDay() + 6) % 7;
  const monday = addDays(date, -mondayOffset);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

/** Ключ недели — дата её понедельника «ГГГГ-ММ-ДД». */
export function getWeekStartKey(date: Date): string {
  const mondayOffset = (date.getDay() + 6) % 7;
  return toDateKey(addDays(date, -mondayOffset));
}

/** Номер дня от 1 января 1970 — удобно, чтобы «практика дня» менялась раз в сутки. */
export function getDayNumber(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
}

/** Буквы «МАТЭТИС» вместо названий дней: понедельник … воскресенье. */
export const matetisLetters = ["М", "А", "Т", "Е", "Т", "И", "С"] as const;

/** Семь дней предыдущей недели, с понедельника. */
export function getPreviousWeekDays(date: Date): Date[] {
  return getWeekDays(addDays(date, -7));
}
