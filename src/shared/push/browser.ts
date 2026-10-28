// Уведомления в браузере: поддержка, разрешение и подписка этого устройства. Только для экранов.

/** Ключ из base64url в байты — так его принимает pushManager.subscribe. */
export function keyBytes(base64: string): Uint8Array<ArrayBuffer> {
  const normalized = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

/** Умеет ли браузер получать уведомления. На iPhone — только приложение, добавленное на экран «Домой». */
export function pushSupported() {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/** Подписка этого устройства или null. */
export async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.getSubscription();
}

/** Подписать устройство ключом сервера. Повторный вызов вернёт ту же подписку. */
export async function subscribeDevice(publicKey: string): Promise<PushSubscription> {
  const registration = await navigator.serviceWorker.ready;
  return registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(publicKey) });
}
