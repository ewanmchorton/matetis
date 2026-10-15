// Личные настройки человека. Только серверный код.
// Функции работают только с настройками самого viewerId: чужие настройки не читаются и не меняются.
import { eq } from "drizzle-orm";

import { db, personSettings } from "@/shared/db";

export type PersonSettings = {
  /** Попадают ли мои события в ленту друзей. */
  publishEvents: boolean;
  /** Согласие на ежемесячный автоподбор совместной практики. */
  autoMatchConsent: boolean;
};

const defaults: PersonSettings = { publishEvents: true, autoMatchConsent: true };

export async function getMySettings(viewerId: string): Promise<PersonSettings> {
  const [row] = await db
    .select({
      publishEvents: personSettings.publishEvents,
      autoMatchConsent: personSettings.autoMatchConsent,
    })
    .from(personSettings)
    .where(eq(personSettings.userId, viewerId))
    .limit(1);
  return row ?? defaults;
}

/** Изменить одну или обе настройки. Возвращает настройки после изменения. */
export async function updateMySettings(
  viewerId: string,
  changes: Partial<PersonSettings>,
): Promise<PersonSettings> {
  const set: Partial<PersonSettings> = {};
  if (typeof changes.publishEvents === "boolean") set.publishEvents = changes.publishEvents;
  if (typeof changes.autoMatchConsent === "boolean") set.autoMatchConsent = changes.autoMatchConsent;
  if (Object.keys(set).length === 0) return getMySettings(viewerId);

  const [row] = await db
    .insert(personSettings)
    .values({ userId: viewerId, ...defaults, ...set })
    .onConflictDoUpdate({ target: personSettings.userId, set: { ...set, updatedAt: new Date() } })
    .returning({
      publishEvents: personSettings.publishEvents,
      autoMatchConsent: personSettings.autoMatchConsent,
    });
  return row;
}
