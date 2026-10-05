"use client";

import { createLocalStore } from "@/shared/lib/create-local-store";

import type { LibraryItem, LibraryItemKind } from "../model/types";

// Демо-каталог: только материалы, которые уже есть. Админка дополняет его в браузере.
const seedItems: LibraryItem[] = [
  {
    id: "water-intro",
    kind: "video",
    elementId: "water",
    title: "Вводное слово о даосской стихии Воды",
    duration: "20 мин",
  },
  {
    id: "water-lesson-1",
    kind: "video",
    elementId: "water",
    title: "Урок 1. Почки, покой и внутренняя опора",
    duration: "14 мин",
  },
  {
    id: "water-lesson-2",
    kind: "video",
    elementId: "water",
    title: "Урок 2. Страх, мудрость и внутренняя улыбка",
    duration: "16 мин",
  },
  {
    id: "water-meditation-deep",
    kind: "meditation",
    elementId: "water",
    title: "Медитация «Глубина»",
    duration: "15 мин",
  },
  {
    id: "water-meditation-night",
    kind: "meditation",
    elementId: "water",
    title: "Медитация перед сном",
    duration: "12 мин",
  },
  { id: "book-tao", kind: "book", elementId: "water", title: "Дао дэ цзин", author: "Лао-цзы" },
  {
    id: "book-qigong",
    kind: "book",
    elementId: "water",
    title: "Цигун для начинающих",
    author: "Мантак Чиа",
  },
  {
    id: "film-seasons",
    kind: "film",
    elementId: "water",
    title: "Весна, лето, осень, зима… и снова весна",
    year: 2003,
  },
];

const store = createLocalStore<{ items: LibraryItem[] }>("matetis-demo-library-v1", {
  items: seedItems,
});

export function useLibraryItems(): LibraryItem[] {
  return store.useStore().items;
}

export function filterLibrary(items: LibraryItem[], kind: LibraryItemKind): LibraryItem[] {
  return items.filter((i) => i.kind === kind);
}

export const libraryActions = {
  add(item: LibraryItem) {
    store.update((s) => ({ items: [item, ...s.items] }));
  },
  remove(id: string) {
    store.update((s) => ({ items: s.items.filter((i) => i.id !== id) }));
  },
  reset() {
    store.reset();
  },
};
