// Дни для совместных практик и ленты. Без обращений к базе. Дни – строки «2026-11-17».

const DAY_MS = 24 * 60 * 60 * 1000;

/** Сколько дней идёт совместная практика, включая день согласия. */
export const JOINT_DAYS = 7;
/** Сколько ждём ответа на приглашение или предложение месяца. */
export const ANSWER_DAYS = 3;
/** С какого числа месяца приложение предлагает пару: первые дни люди приглашают сами. */
export const MONTHLY_MATCH_FROM_DAY = 4;
/** Возвращение – отметка после перерыва, в котором больше стольких дней без практики. */
export const COMEBACK_GAP_DAYS = 7;

function dayNumber(day: string): number {
  const [year, month, date] = day.split("-").map(Number);
  return Math.round(Date.UTC(year, month - 1, date) / DAY_MS);
}

export function addDays(day: string, days: number): string {
  return new Date((dayNumber(day) + days) * DAY_MS).toISOString().slice(0, 10);
}

/** Сколько дней от a до b: от 17-го до 20-го – 3. */
export function daysBetween(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

/** Последний день совместной практики, которая началась в этот день. */
export function jointEndsOn(startsOn: string): string {
  return addDays(startsOn, JOINT_DAYS - 1);
}

/** Первое число месяца: «2026-11-17» → «2026-11-01». */
export function monthOf(day: string): string {
  return `${day.slice(0, 7)}-01`;
}

/** Пора ли в этот день предлагать пару месяца. */
export function monthlyMatchDue(today: string): boolean {
  return Number(today.slice(8, 10)) >= MONTHLY_MATCH_FROM_DAY;
}

/** Срок ответа вышел: прошло 3 суток с приглашения. */
export function answerExpired(createdAt: Date, now: Date): boolean {
  return now.getTime() - createdAt.getTime() >= ANSWER_DAYS * DAY_MS;
}

/** До какого момента ждём ответа. */
export function answerDeadline(createdAt: Date): Date {
  return new Date(createdAt.getTime() + ANSWER_DAYS * DAY_MS);
}

/** Отметка сегодня – возвращение: с прошлой отметки прошло больше 7 дней без практики. */
export function isComeback(previousDay: string, today: string): boolean {
  return daysBetween(previousDay, today) - 1 > COMEBACK_GAP_DAYS;
}
