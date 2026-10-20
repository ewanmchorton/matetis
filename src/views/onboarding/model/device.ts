/**
 * Какое устройство у человека — от этого зависит инструкция по установке.
 * inApp — браузер внутри Telegram, Instagram и других приложений: установить оттуда нельзя.
 */
export type Device = "iphone" | "android" | "inApp" | "other";

export function detectDevice(userAgent: string, maxTouchPoints = 0): Device {
  // iPad с новой iOS представляется Mac, отличаем его по сенсорному экрану.
  const ios = /iPhone|iPad|iPod/.test(userAgent) || (/Macintosh/.test(userAgent) && maxTouchPoints > 1);
  const inApp =
    /Instagram|FBAN|FBAV|Telegram|VKClient|Line\/|; wv\)/.test(userAgent) ||
    // Встроенный браузер на iPhone не добавляет «Safari» в описание, в отличие от Safari и Chrome.
    (ios && !/Safari\//.test(userAgent));
  if (inApp) return "inApp";
  if (ios) return "iphone";
  if (/Android/.test(userAgent)) return "android";
  return "other";
}

/**
 * Ссылка, которая открывает текущую страницу в обычном браузере из встроенного.
 * Android понимает intent-ссылку на Chrome, iPhone — схему Safari. Не везде срабатывает,
 * поэтому рядом всегда есть инструкция «меню → Открыть в браузере».
 */
export function openInBrowserUrl(device: "android" | "iphone", url: URL): string {
  if (device === "android") {
    return `intent://${url.host}${url.pathname}${url.search}#Intent;scheme=${url.protocol.replace(":", "")};package=com.android.chrome;end`;
  }
  return `x-safari-${url.href}`;
}
