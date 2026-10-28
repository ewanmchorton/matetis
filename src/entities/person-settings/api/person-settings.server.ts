// Личные настройки человека. Только серверный код.
// Функции работают только с настройками самого viewerId: чужие настройки не читаются и не меняются.
import { eq } from "drizzle-orm";

import { db, personSettings } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

export type PersonSettings = {
  /** Попадают ли мои события в ленту друзей. */
  publishEvents: boolean;
  /** Согласие на ежемесячный автоподбор совместной практики. */
  autoMatchConsent: boolean;
  /** Согласие получать фразу дня уведомлением. */
  phraseNotifications: boolean;
  /** С какого часа может прийти фраза дня (0–23). */
  phraseFromHour: number;
  /** До какого часа может прийти фраза дня, не включительно (1–24). */
  phraseToHour: number;
};

export type PersonSettingsChanges = Partial<PersonSettings> & {
  /** Часовой пояс телефона, например «Europe/Minsk». Приходит с телефона, человек его не выбирает. */
  timeZone?: string;
};

const defaults: PersonSettings = {
  publishEvents: true,
  autoMatchConsent: true,
  phraseNotifications: true,
  phraseFromHour: 9,
  phraseToHour: 21,
};

const columns = {
  publishEvents: personSettings.publishEvents,
  autoMatchConsent: personSettings.autoMatchConsent,
  phraseNotifications: personSettings.phraseNotifications,
  phraseFromHour: personSettings.phraseFromHour,
  phraseToHour: personSettings.phraseToHour,
};

export async function getMySettings(viewerId: string): Promise<PersonSettings> {
  const [row] = await db.select(columns).from(personSettings).where(eq(personSettings.userId, viewerId)).limit(1);
  return row ?? defaults;
}

/** Существует ли такой часовой пояс. */
export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("ru-RU", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

function isHour(value: unknown, min: number, max: number): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= min && value <= max;
}

/** Изменить одну или несколько настроек. Возвращает настройки после изменения. */
export async function updateMySettings(viewerId: string, changes: PersonSettingsChanges): Promise<PersonSettings> {
  const set: Partial<PersonSettings> & { timeZone?: string } = {};
  if (typeof changes.publishEvents === "boolean") set.publishEvents = changes.publishEvents;
  if (typeof changes.autoMatchConsent === "boolean") set.autoMatchConsent = changes.autoMatchConsent;
  if (typeof changes.phraseNotifications === "boolean") set.phraseNotifications = changes.phraseNotifications;
  if (isHour(changes.phraseFromHour, 0, 23)) set.phraseFromHour = changes.phraseFromHour;
  if (isHour(changes.phraseToHour, 1, 24)) set.phraseToHour = changes.phraseToHour;
  if (typeof changes.timeZone === "string" && isTimeZone(changes.timeZone)) set.timeZone = changes.timeZone;
  if (Object.keys(set).length === 0) return getMySettings(viewerId);

  if (set.phraseFromHour !== undefined || set.phraseToHour !== undefined) {
    const current = await getMySettings(viewerId);
    const from = set.phraseFromHour ?? current.phraseFromHour;
    const to = set.phraseToHour ?? current.phraseToHour;
    if (from >= to) throw new AppError("invalid_phrase_hours", "Время «до» должно быть позже времени «с»");
  }

  const [row] = await db
    .insert(personSettings)
    .values({ userId: viewerId, ...defaults, ...set })
    .onConflictDoUpdate({ target: personSettings.userId, set: { ...set, updatedAt: new Date() } })
    .returning(columns);
  return row;
}
