"use client";

import { request } from "@/shared/api/request";
import { currentSubscription, pushSupported, subscribeDevice } from "@/shared/push/browser";

/**
 * Можно ли прислать фразу дня на этот телефон.
 * unsupported — браузер не умеет (на iPhone — пока приложение не добавлено на «Домой»),
 * denied — человек запретил уведомления в настройках телефона, off — ещё не разрешал, on — подписан.
 */
export type DeviceState = "checking" | "unsupported" | "denied" | "off" | "on";

export async function readDeviceState(): Promise<Exclude<DeviceState, "checking">> {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "denied") return "denied";
  try {
    return (await currentSubscription()) ? "on" : "off";
  } catch {
    return "off";
  }
}

export type PushInfo = { publicKey: string | null; phraseNotifications: boolean };

export function readPushInfo() {
  return request<PushInfo>("/api/push");
}

/**
 * Попросить разрешение и подписать телефон. Вызывать только по нажатию кнопки:
 * иначе телефон не покажет запрос. Вместе с подпиской сохраняется часовой пояс телефона.
 */
export async function enableOnDevice(): Promise<Exclude<DeviceState, "checking">> {
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return permission === "denied" ? "denied" : "off";
  const { publicKey } = await readPushInfo();
  if (!publicKey) throw new Error("Уведомления пока не настроены на сервере");
  const subscription = await subscribeDevice(publicKey);
  await request("/api/push", {
    method: "POST",
    body: JSON.stringify({ ...subscription.toJSON(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone }),
  });
  return "on";
}
