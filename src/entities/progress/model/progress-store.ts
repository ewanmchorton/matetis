"use client";

import { useSyncExternalStore } from "react";

import { addDays, getWeekDays, getWeekStartKey, toDateKey } from "@/shared/lib/date";

/**
 * Результат теста и отметки о практиках в прототипе хранятся в браузере (localStorage).
 * Когда появится сервер, этот модуль заменится на запросы к API,
 * а экраны останутся прежними.
 */
export type ProgressState = {
  typeId: string | null;
  /** Дни («ГГГГ-ММ-ДД»), в которые выполнена практика дня */
  completedPractices: string[];
  /**
   * Отметки ритуалов.
   * Для ежедневных — ключи дней; для «раз в неделю» — ключ понедельника недели.
   */
  ritualMarks: Record<string, string[]>;
};

const STORAGE_KEY = "matetis-demo-progress-v3";

const initialState: ProgressState = {
  typeId: "t7",
  completedPractices: [],
  ritualMarks: {},
};

/** Выдуманная история за прошлые дни, чтобы в профиле было что показать. */
function createDemoState(): ProgressState {
  const today = new Date();
  const daysAgo = (n: number) => toDateKey(addDays(today, -n));
  const todayKey = toDateKey(today);
  const weekKeys = getWeekDays(today)
    .map((d) => toDateKey(d))
    .filter((k) => k <= todayKey);
  const demoThisWeek = weekKeys.slice(-3);
  const older = [daysAgo(7), daysAgo(8), daysAgo(14)].filter((k) => !demoThisWeek.includes(k));
  return {
    ...initialState,
    completedPractices: [...new Set([...demoThisWeek, ...older])],
    ritualMarks: {
      "water-subjects-study": [daysAgo(1), daysAgo(2), daysAgo(4)],
      "water-tuata-charge": [getWeekStartKey(today)],
      "water-weekly-audio": [getWeekStartKey(today)],
    },
  };
}

let state: ProgressState = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const demo = createDemoState();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    state = raw ? { ...demo, ...(JSON.parse(raw) as Partial<ProgressState>) } : demo;
  } catch {
    state = demo;
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

function toggleDay(days: string[], day: string): string[] {
  return days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
}

export const progressActions = {
  setType(typeId: string) {
    setState({ ...state, typeId });
  },
  togglePractice(day: string) {
    setState({ ...state, completedPractices: toggleDay(state.completedPractices, day) });
  },
  toggleDailyRitual(ritualId: string, day: string) {
    const marks = state.ritualMarks[ritualId] ?? [];
    setState({
      ...state,
      ritualMarks: { ...state.ritualMarks, [ritualId]: toggleDay(marks, day) },
    });
  },
  toggleWeeklyRitual(ritualId: string, weekKey: string) {
    const marks = state.ritualMarks[ritualId] ?? [];
    const done = marks.includes(weekKey);
    setState({
      ...state,
      ritualMarks: {
        ...state.ritualMarks,
        [ritualId]: done ? marks.filter((k) => k !== weekKey) : [...marks, weekKey],
      },
    });
  },
  reset() {
    setState(createDemoState());
  },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
