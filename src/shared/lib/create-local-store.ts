"use client";

import { useSyncExternalStore } from "react";

/**
 * Простое хранилище в localStorage с подпиской для React.
 * На сервере и при первой отрисовке возвращает исходные данные (seed),
 * в браузере — сохранённые. Открытые вкладки синхронизируются через событие storage.
 */
export function createLocalStore<T>(storageKey: string, seed: T) {
  let state: T = seed;
  let loaded = false;
  const listeners = new Set<() => void>();

  function read() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      state = raw ? { ...seed, ...(JSON.parse(raw) as Partial<T>) } : seed;
    } catch {
      state = seed;
    }
  }

  function load() {
    if (loaded || typeof window === "undefined") return;
    loaded = true;
    read();
    window.addEventListener("storage", (e) => {
      if (e.key !== storageKey) return;
      read();
      listeners.forEach((l) => l());
    });
  }

  function set(next: T) {
    state = next;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Хранилище браузера недоступно — работаем только в памяти.
    }
    listeners.forEach((l) => l());
  }

  function subscribe(listener: () => void) {
    load();
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function get(): T {
    load();
    return state;
  }

  return {
    get,
    set,
    update(updater: (current: T) => T) {
      set(updater(get()));
    },
    reset() {
      set(seed);
    },
    useStore(): T {
      return useSyncExternalStore(subscribe, get, () => seed);
    },
  };
}

export function createId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}
