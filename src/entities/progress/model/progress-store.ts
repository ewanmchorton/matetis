"use client";

import { useSyncExternalStore } from "react";

/**
 * Результат теста без сервера: на сайте-прототипе (GitHub Pages) и при разработке без входа.
 * Хранится в браузере (localStorage), чтобы экраны теста и результата можно было пройти целиком.
 */
export type ProgressState = {
  typeId: string | null;
  /** Тест пройден в этом браузере. */
  testTaken: boolean;
  /** «ГГГГ-ММ-ДД» или null, если человек дату не указал */
  birthDate: string | null;
};

const STORAGE_KEY = "matetis-demo-progress-v5";

const initialState: ProgressState = {
  typeId: null,
  testTaken: false,
  birthDate: null,
};

let state: ProgressState = initialState;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const saved = raw ? (JSON.parse(raw) as Partial<ProgressState>) : {};
    state = {
      typeId: saved.typeId ?? null,
      testTaken: saved.testTaken ?? false,
      birthDate: saved.birthDate ?? null,
    };
  } catch {
    state = initialState;
  }
}

function setState(next: ProgressState) {
  state = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Хранилище браузера недоступно – работаем только в памяти.
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

/** Действие может прийти с экрана, который сам результат не показывает – сначала читаем сохранённое. */
function edit(updater: (current: ProgressState) => ProgressState) {
  load();
  setState(updater(state));
}

export const progressActions = {
  setType(typeId: string) {
    edit((current) => ({ ...current, typeId, testTaken: true }));
  },
  /** Сайт-прототип: следующий проход после онбординга снова начинается с вопросов теста. */
  forgetTest() {
    edit((current) => ({ ...current, testTaken: false }));
  },
  setBirthDate(birthDate: string | null) {
    edit((current) => ({ ...current, birthDate }));
  },
};

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
