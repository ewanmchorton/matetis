import { describe, expect, it } from "vitest";

import { detectDevice, openInBrowserUrl } from "./device";

const ua = {
  iphoneSafari:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1",
  iphoneChrome:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0 Mobile/15E148 Safari/604.1",
  iphoneTelegram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
  iphoneInstagram:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 350.0",
  ipad: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
  androidChrome:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36",
  androidTelegram:
    "Mozilla/5.0 (Linux; Android 14; Pixel 8; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/130.0 Mobile Safari/537.36 Telegram-Android/11.0",
  macChrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
};

describe("Устройство для инструкции по установке", () => {
  it("Safari и Chrome на iPhone — iphone", () => {
    expect(detectDevice(ua.iphoneSafari, 5)).toBe("iphone");
    expect(detectDevice(ua.iphoneChrome, 5)).toBe("iphone");
  });

  it("iPad, который представляется Mac, — iphone", () => {
    expect(detectDevice(ua.ipad, 5)).toBe("iphone");
  });

  it("Chrome на Android — android", () => {
    expect(detectDevice(ua.androidChrome, 5)).toBe("android");
  });

  it("браузер внутри Telegram и Instagram — inApp", () => {
    expect(detectDevice(ua.iphoneTelegram, 5)).toBe("inApp");
    expect(detectDevice(ua.iphoneInstagram, 5)).toBe("inApp");
    expect(detectDevice(ua.androidTelegram, 5)).toBe("inApp");
  });

  it("компьютер — other", () => {
    expect(detectDevice(ua.macChrome, 0)).toBe("other");
  });
});

describe("Ссылка «Открыть в браузере»", () => {
  const url = new URL("https://example.com/matetis/onboarding/?a=1");

  it("Android — intent-ссылка на Chrome", () => {
    expect(openInBrowserUrl("android", url)).toBe(
      "intent://example.com/matetis/onboarding/?a=1#Intent;scheme=https;package=com.android.chrome;end",
    );
  });

  it("iPhone — схема Safari", () => {
    expect(openInBrowserUrl("iphone", url)).toBe("x-safari-https://example.com/matetis/onboarding/?a=1");
  });
});
