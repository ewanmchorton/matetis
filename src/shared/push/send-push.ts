// Отправка уведомления на устройство через службу уведомлений браузера (web-push). Только серверный код.
// Ключи — VAPID_* в .env.local (см. .env.example).
import webpush from "web-push";

export type PushTarget = { endpoint: string; p256dh: string; auth: string };

/** Что покажет телефон. url — что открыть по нажатию. */
export type PushMessage = { title: string; body: string; url: string };

let configured = false;

/** Ключи для браузера: им он подписывается на уведомления. null — ключи не заданы. */
export function getPushPublicKey(): string | null {
  return process.env.VAPID_PUBLIC_KEY || null;
}

/**
 * Отправить уведомление. "gone" — устройство отписалось или подписка устарела: её надо удалить.
 * Без ключей ничего не отправляет.
 */
export async function sendPush(target: PushTarget, message: PushMessage): Promise<"sent" | "gone" | "skipped"> {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return "skipped";
  if (!configured) {
    webpush.setVapidDetails(process.env.VAPID_SUBJECT ?? "mailto:admin@matetis.local", publicKey, privateKey);
    configured = true;
  }
  try {
    await webpush.sendNotification(
      { endpoint: target.endpoint, keys: { p256dh: target.p256dh, auth: target.auth } },
      JSON.stringify(message),
    );
    return "sent";
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) return "gone";
    throw error;
  }
}
