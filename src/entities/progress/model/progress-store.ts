"use client";

import { useSyncExternalStore } from "react";

/**
 * Отметки ученика в прототипе хранятся в браузере (localStorage).
 * Когда появится сервер, этот модуль заменится на запросы к API,
 * а экраны останутся прежними.
 */
export type ProgressState = {
  typeId: string | null;
  completedPracticeIds: string[];
  completedRitualIds: string[];
};

const STORAGE_KEY = "matetis-demo-progress-v1";

const initialState: ProgressState = {
  typeId: "t7",
  completedPracticeIds: ["metal-d1", "metal-d2"],
  completedRitualIds: ["metal-r1"],
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

const toggle = (list: string[], id: string) =>
  list.includes(id) ? list.filter((x) => x !== id) : [...list, id];

export const progressActions = {
  togglePractice(id: string) {
    setState({ ...state, completedPracticeIds: toggle(state.completedPracticeIds, id) });
  },
  toggleRitual(id: string) {
    setState({ ...state, completedRitualIds: toggle(state.completedRitualIds, id) });
  },
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
