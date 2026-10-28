// Устройства, на которые человек разрешил уведомления (web-push). Только серверный код.
// Одно устройство — один браузер; у человека их может быть несколько.
import { and, eq, inArray } from "drizzle-orm";

import { db, pushSubscription } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import { sendPush, type PushMessage } from "./send-push";

export type SubscriptionInput = { endpoint?: unknown; keys?: unknown };

/** Сохранить устройство человека. Повторное сохранение того же устройства обновляет ключи. */
export async function savePushSubscription(userId: string, input: SubscriptionInput) {
  const keys = (input.keys && typeof input.keys === "object" ? input.keys : {}) as Record<string, unknown>;
  const { endpoint } = input;
  if (typeof endpoint !== "string" || !endpoint.startsWith("https://")) {
    throw new AppError("invalid_subscription", "Не удалось включить уведомления");
  }
  if (typeof keys.p256dh !== "string" || typeof keys.auth !== "string") {
    throw new AppError("invalid_subscription", "Не удалось включить уведомления");
  }
  const row = { userId, endpoint, p256dh: keys.p256dh, auth: keys.auth };
  await db.insert(pushSubscription).values(row).onConflictDoUpdate({ target: pushSubscription.endpoint, set: row });
  return { ok: true };
}

/** Выключить уведомления на устройстве. Чужое устройство не трогается. */
export async function removePushSubscription(userId: string, endpoint: unknown) {
  if (typeof endpoint !== "string") return { ok: true };
  await db
    .delete(pushSubscription)
    .where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.endpoint, endpoint)));
  return { ok: true };
}

/**
 * Отправить уведомление на все устройства человека. Устаревшие устройства удаляются.
 * Возвращает, на сколько устройств ушло.
 */
export async function sendPushToUser(userId: string, message: PushMessage): Promise<number> {
  const targets = await db
    .select({ endpoint: pushSubscription.endpoint, p256dh: pushSubscription.p256dh, auth: pushSubscription.auth })
    .from(pushSubscription)
    .where(eq(pushSubscription.userId, userId));
  const gone: string[] = [];
  let delivered = 0;
  await Promise.all(
    targets.map(async (target) => {
      try {
        const result = await sendPush(target, message);
        if (result === "gone") gone.push(target.endpoint);
        if (result === "sent") delivered++;
      } catch (error) {
        console.error("Уведомление не отправлено", error);
      }
    }),
  );
  if (gone.length) await db.delete(pushSubscription).where(inArray(pushSubscription.endpoint, gone));
  return delivered;
}
