"use client";

import { useSyncExternalStore } from "react";

/**
 * Результат теста в прототипе хранится в браузере (localStorage).
 * Когда появится сервер, этот модуль заменится на запросы к API,
 * а экраны останутся прежними.
 */
export type ProgressState = {
  typeId: string | null;
};

const STORAGE_KEY = "matetis-demo-progress-v2";

const initialState: ProgressState = {
  typeId: "t7",
};

let state: ProgressState = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) state = { ...initialState, ...(JSON.parse(raw) as Partial<ProgressState>) };
  } catch {
    state = initialState;
  }
}

function setState(next: ProgressState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function getSnapshot() {
  load();
  return state;
}

function getServerSnapshot() {
  return initialState;
}

export const progressActions = {
  setType(typeId: string) {
    setState({ ...state, typeId });
  },
  reset() {
    setState(initialState);
  },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
