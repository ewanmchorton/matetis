// Уведомления администратору о доступах. Только серверный код.
// Заявка — сразу, на каждую. Доступ скоро закончится — одна сводка в день в 10:00 по Минску,
// если есть кого упомянуть; каждый человек попадает в сводку один раз за срок доступа.
import { eq, gte, inArray } from "drizzle-orm";

import { assertAdmin } from "@/shared/auth/assert-admin";
import { APP_NAME } from "@/shared/config/brand";
import { routes } from "@/shared/config/routes";
import { accessExpiryReminder, db, pushSubscription, user } from "@/shared/db";
import { sendPush, type PushMessage } from "@/shared/push/send-push";
import { removePushSubscription, savePushSubscription, type SubscriptionInput } from "@/shared/push/subscriptions.server";

import { EXPIRING_DAYS, hasAccess, listAccessItems } from "./access.server";

/** Час сводки по Минску. */
export const DIGEST_HOUR = 10;
/** В Беларуси нет перехода на летнее время: всегда UTC+3. */
const MINSK_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Сохранить устройство, на которое администратор разрешил уведомления. */
export async function saveMyPushSubscription(adminId: string, input: SubscriptionInput) {
  await assertAdmin(adminId);
  return savePushSubscription(adminId, input);
}

/** Выключить уведомления на этом устройстве. */
export async function removeMyPushSubscription(adminId: string, endpoint: unknown) {
  return removePushSubscription(adminId, endpoint);
}

/** Отправить всем устройствам администраторов. Ошибка одного устройства не мешает остальным. */
async function notifyAdmins(message: PushMessage) {
  const targets = await db
    .select({ endpoint: pushSubscription.endpoint, p256dh: pushSubscription.p256dh, auth: pushSubscription.auth })
    .from(pushSubscription)
    .innerJoin(user, eq(user.id, pushSubscription.userId))
    .where(eq(user.role, "admin"));
  const gone: string[] = [];
  await Promise.all(
    targets.map(async (target) => {
      try {
        if ((await sendPush(target, message)) === "gone") gone.push(target.endpoint);
      } catch (error) {
        console.error("Уведомление не отправлено", error);
      }
    }),
  );
  if (gone.length) await db.delete(pushSubscription).where(inArray(pushSubscription.endpoint, gone));
}

/** Человек прошёл тест: если доступа нет — это заявка, сразу сообщаем администратору. */
export async function notifyNewRequest(person: { id: string; email: string; name: string; role?: string | null }) {
  if (await hasAccess(person)) return;
  await notifyAdmins({
    title: APP_NAME,
    body: `Новая заявка: ${person.name || person.email}`,
    url: `${routes.adminAccess}?filter=request`,
  });
}

/** «У 1 человека», «у 3 человек», «у 21 человека». */
export function peopleCount(count: number): string {
  const lastTwo = count % 100;
  const last = count % 10;
  const word = last === 1 && lastTwo !== 11 ? "человека" : "человек";
  return `${count} ${word}`;
}

/** Начало сегодняшних суток по Минску и текущий час там. */
function minskClock(now: Date) {
  const minsk = new Date(now.getTime() + MINSK_OFFSET_MS);
  const dayStart = new Date(Date.UTC(minsk.getUTCFullYear(), minsk.getUTCMonth(), minsk.getUTCDate()) - MINSK_OFFSET_MS);
  return { hour: minsk.getUTCHours(), dayStart };
}

/**
 * Ежедневная сводка «доступ скоро закончится». Вызывается по таймеру несколько раз в час:
 * отправляет не раньше DIGEST_HOUR и не больше одного раза в сутки. Возвращает, сколько людей в сводке.
 */
export async function sendExpiringDigest(now = new Date()): Promise<number> {
  const { hour, dayStart } = minskClock(now);
  if (hour < DIGEST_HOUR) return 0;
  const [sentToday] = await db
    .select({ email: accessExpiryReminder.email })
    .from(accessExpiryReminder)
    .where(gte(accessExpiryReminder.sentAt, dayStart))
    .limit(1);
  if (sentToday) return 0;

  const [items, reminded] = await Promise.all([
    listAccessItems("", now),
    db.select({ email: accessExpiryReminder.email, accessUntil: accessExpiryReminder.accessUntil }).from(accessExpiryReminder),
  ]);
  const alreadyReminded = new Set(reminded.map((row) => `${row.email}|${row.accessUntil.getTime()}`));
  const expiring = items.flatMap((item) =>
    item.status.kind === "active" &&
    item.status.expiring &&
    !alreadyReminded.has(`${item.email}|${item.status.until.getTime()}`)
      ? [{ email: item.email, accessUntil: item.status.until }]
      : [],
  );
  if (expiring.length === 0) return 0;

  await db
    .insert(accessExpiryReminder)
    .values(expiring.map((row) => ({ ...row, sentAt: now })))
    .onConflictDoNothing();
  await notifyAdmins({
    title: APP_NAME,
    body: `У ${peopleCount(expiring.length)} доступ закончится в ближайшие ${EXPIRING_DAYS} дня`,
    url: `${routes.adminAccess}?filter=expiring`,
  });
  return expiring.length;
}
