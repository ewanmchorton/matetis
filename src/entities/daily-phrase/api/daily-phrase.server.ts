// Фразы дня: загрузка в админке и отправка человеку уведомлением. Только серверный код.
// Раз в день, в случайный момент внутри промежутка, который человек выбрал в профиле, по часам его телефона.
import { and, asc, desc, eq, isNull, notExists, or, sql } from "drizzle-orm";

import { hasAccess } from "@/entities/access/server";
import { getPersonTypes } from "@/entities/person-type";
import { getMyCurrentType } from "@/entities/type-test-attempt/server";
import { assertStaff } from "@/shared/auth/assert-admin";
import type { ContactPerson } from "@/shared/auth/contact";
import { APP_NAME } from "@/shared/config/brand";
import { routes } from "@/shared/config/routes";
import { dailyPhrase, dailyPhraseDelivery, dailyPhraseType, db, personSettings, pushSubscription, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";
import { sendPushToUser } from "@/shared/push/subscriptions.server";

import { PHRASE_MAX_LENGTH } from "../index";
import { DEFAULT_TIME_ZONE, localDay, localHourToMoment } from "../model/zoned-time";

export type DailyPhrase = {
  id: string;
  text: string;
  /** Каким типам подходит. Пусто — всем. */
  typeIds: string[];
  createdAt: Date;
};

/** Все фразы, новые сверху. Для админа и контент-менеджера. */
export async function listPhrasesForStaff(viewerId: string): Promise<DailyPhrase[]> {
  await assertStaff(viewerId);
  const [phrases, types] = await Promise.all([
    db.select().from(dailyPhrase).orderBy(desc(dailyPhrase.createdAt), desc(dailyPhrase.id)),
    db.select().from(dailyPhraseType),
  ]);
  return phrases.map((phrase) => ({
    ...phrase,
    typeIds: types.filter((type) => type.phraseId === phrase.id).map((type) => type.typeId),
  }));
}

/** Добавить фразу. typeIds — каким типам подходит; пусто — всем. */
export async function addPhrase(viewerId: string, input: { text?: unknown; typeIds?: unknown }) {
  await assertStaff(viewerId);
  const text = typeof input.text === "string" ? input.text.trim() : "";
  if (!text) throw new AppError("empty_phrase", "Напишите фразу");
  if (text.length > PHRASE_MAX_LENGTH) {
    throw new AppError("long_phrase", `Фраза длиннее ${PHRASE_MAX_LENGTH} знаков — в уведомлении она не поместится`);
  }
  const known = new Set(getPersonTypes().map((type) => type.id));
  const typeIds = Array.isArray(input.typeIds) ? [...new Set(input.typeIds.filter((id) => known.has(id)))] : [];

  return db.transaction(async (tx) => {
    const [phrase] = await tx.insert(dailyPhrase).values({ text }).returning();
    if (typeIds.length) await tx.insert(dailyPhraseType).values(typeIds.map((typeId) => ({ phraseId: phrase.id, typeId })));
    return { ...phrase, typeIds } satisfies DailyPhrase;
  });
}

/** Удалить фразу. Уже отправленные остаются в истории без текста. */
export async function deletePhrase(viewerId: string, phraseId: unknown) {
  await assertStaff(viewerId);
  if (typeof phraseId !== "string") return { ok: true };
  await db.delete(dailyPhrase).where(eq(dailyPhrase.id, phraseId));
  return { ok: true };
}

/**
 * Фраза для человека: из подходящих его типу (или всем) — та, что приходила ему реже всего,
 * среди равных — случайная. Так фразы не повторяются, пока не придут все.
 */
async function pickPhrase(userId: string, typeId: string | null, random: () => number) {
  const fitsEveryone = notExists(db.select().from(dailyPhraseType).where(eq(dailyPhraseType.phraseId, dailyPhrase.id)));
  const fitsType = typeId
    ? sql`exists (select 1 from ${dailyPhraseType} where ${dailyPhraseType.phraseId} = ${dailyPhrase.id} and ${dailyPhraseType.typeId} = ${typeId})`
    : undefined;
  const timesSent = sql<number>`(select count(*) from ${dailyPhraseDelivery} where ${dailyPhraseDelivery.userId} = ${userId} and ${dailyPhraseDelivery.phraseId} = ${dailyPhrase.id})::int`;
  const candidates = await db
    .select({ id: dailyPhrase.id, text: dailyPhrase.text, timesSent })
    .from(dailyPhrase)
    .where(fitsType ? or(fitsEveryone, fitsType) : fitsEveryone)
    .orderBy(asc(timesSent));
  if (candidates.length === 0) return null;
  const least = candidates.filter((phrase) => phrase.timesSent === candidates[0].timesSent);
  return least[Math.floor(random() * least.length)];
}

/**
 * Назначить и отправить фразы дня. Вызывается по таймеру раз в несколько минут.
 * Человеку с согласием, доступом и хотя бы одним устройством назначается случайный момент
 * внутри его промежутка на сегодня; когда момент наступил — уходит фраза.
 * Возвращает, скольким людям ушла фраза.
 */
export async function sendDailyPhrases(now = new Date(), random: () => number = Math.random): Promise<number> {
  const people = await db
    .selectDistinct({
      id: user.id,
      email: user.email,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      role: user.role,
      phraseNotifications: personSettings.phraseNotifications,
      fromHour: personSettings.phraseFromHour,
      toHour: personSettings.phraseToHour,
      timeZone: personSettings.timeZone,
    })
    .from(user)
    .innerJoin(pushSubscription, eq(pushSubscription.userId, user.id))
    .leftJoin(personSettings, eq(personSettings.userId, user.id));

  let sentCount = 0;
  for (const person of people) {
    // Нет строки настроек — действуют значения по умолчанию: согласие есть, с 9 до 21 по Минску.
    if (person.phraseNotifications === false) continue;
    try {
      if (await sendPhraseTo(person, now, random)) sentCount++;
    } catch (error) {
      console.error("Фраза дня не отправлена", error);
    }
  }
  return sentCount;
}

type Recipient = ContactPerson & {
  id: string;
  role: string | null;
  fromHour: number | null;
  toHour: number | null;
  timeZone: string | null;
};

async function sendPhraseTo(person: Recipient, now: Date, random: () => number): Promise<boolean> {
  const timeZone = person.timeZone ?? DEFAULT_TIME_ZONE;
  const day = localDay(now, timeZone);
  const windowStart = localHourToMoment(day, person.fromHour ?? 9, timeZone);
  const windowEnd = localHourToMoment(day, person.toHour ?? 21, timeZone);
  if (now >= windowEnd) return false;

  const [planned] = await db
    .select()
    .from(dailyPhraseDelivery)
    .where(and(eq(dailyPhraseDelivery.userId, person.id), eq(dailyPhraseDelivery.day, day)))
    .limit(1);
  if (planned?.sentAt) return false;

  // Момент ещё не назначен или человек сменил промежуток — назначаем заново внутри промежутка.
  let sendAt = planned?.sendAt;
  if (!sendAt || sendAt < windowStart || sendAt >= windowEnd) {
    const from = Math.max(now.getTime(), windowStart.getTime());
    sendAt = new Date(from + Math.floor(random() * (windowEnd.getTime() - from)));
    await db
      .insert(dailyPhraseDelivery)
      .values({ userId: person.id, day, sendAt })
      .onConflictDoUpdate({ target: [dailyPhraseDelivery.userId, dailyPhraseDelivery.day], set: { sendAt } });
  }
  if (sendAt > now) return false;

  if (!(await hasAccess(person, now))) return false;
  const type = await getMyCurrentType(person.id);
  const phrase = await pickPhrase(person.id, type?.id ?? null, random);
  if (!phrase) return false;

  const delivered = await sendPushToUser(person.id, { title: APP_NAME, body: phrase.text, url: routes.program });
  if (delivered === 0) return false;
  await db
    .update(dailyPhraseDelivery)
    .set({ phraseId: phrase.id, sentAt: now })
    .where(and(eq(dailyPhraseDelivery.userId, person.id), eq(dailyPhraseDelivery.day, day), isNull(dailyPhraseDelivery.sentAt)));
  return true;
}
