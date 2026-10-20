"use client";

import { useSyncExternalStore } from "react";

/** Событие Chrome на Android: можно показать системное окно «Установить приложение». */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome присылает событие один раз, сразу после загрузки страницы. Ловим его при загрузке модуля,
// а не когда человек дошёл до экрана установки, — иначе оно уже пролетело.
let deferred: BeforeInstallPromptEvent | null = null;
let installed = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    installed = true;
    deferred = null;
    notify();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Открыт ли сайт с иконки на «Домой» — то есть приложение уже установлено. */
export function openedFromHomeScreen(): boolean {
  const nav = navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

export function useInstallPrompt() {
  const canPrompt = useSyncExternalStore(subscribe, () => deferred !== null, () => false);
  const isInstalled = useSyncExternalStore(subscribe, () => installed, () => false);

  /** Показывает системное окно установки. false — браузер такого окна не даёт (iPhone и другие). */
  async function prompt() {
    const event = deferred;
    if (!event) return false;
    deferred = null;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === "accepted") installed = true;
    notify();
    return true;
  }

  return { canPrompt, installed: isInstalled, prompt };
}
