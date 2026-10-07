"use client";

import type { ElementId } from "@/entities/element";
import { createLocalStore } from "@/shared/lib/create-local-store";
import { getDayNumber } from "@/shared/lib/date";

import type { DailyPractice, WeeklyRitual } from "../model/types";

// Демо-данные стихии Воды (даосская пятерка, запуск 1 декабря). Админка дополняет их в браузере.
const seedPractices: DailyPractice[] = [
  {
    id: "water-inner-smile",
    elementId: "water",
    title: "Внутренняя улыбка",
    duration: "12 минут",
    steps: [
      "Сядьте удобно, закройте глаза, дышите спокойно.",
      "Улыбнитесь глазами и направьте это тепло в область почек — «мягкое солнце внутри».",
      "Поблагодарите тело и медленно откройте глаза.",
    ],
    why: "В даосской стихии Воды мы бережём почки и глубинный покой. Внутренняя улыбка согревает изнутри и успокаивает страх.",
  },
  {
    id: "water-element-lesson",
    elementId: "water",
    title: "Размышление над уроком стихии",
    duration: "10 минут",
    steps: [
      "Откройте короткий урок про стихию Воды в разделе «Библиотека».",
      "Прочитайте или прослушайте спокойно, без спешки.",
      "Запишите одну мысль: что из урока откликается вам сегодня.",
    ],
    why: "Стихия меняется — важно не только делать упражнения, но и понимать, зачем они в этом сезоне.",
  },
];

const seedRituals: WeeklyRitual[] = [
  {
    id: "water-subjects-study",
    elementId: "water",
    title: "Освоение предметов",
    description: "15 минут по учебнику: геометрия, физика, биология или химия",
    schedule: "daily",
  },
  {
    id: "water-tuata-charge",
    elementId: "water",
    title: "Зарядка «Туата»",
    description: "Комплекс «Туата» — один раз в неделю",
    schedule: "once_per_week",
  },
  {
    id: "water-weekly-audio",
    elementId: "water",
    title: "Размышление над уроком стихии",
    description: "Один раз за неделю, 25–30 минут — урок и аудио из библиотеки",
    schedule: "once_per_week",
  },
];

type PracticeCatalog = { practices: DailyPractice[]; rituals: WeeklyRitual[] };

const store = createLocalStore<PracticeCatalog>("matetis-demo-practices-v1", {
  practices: seedPractices,
  rituals: seedRituals,
});

export function usePracticeCatalog(): PracticeCatalog {
  return store.useStore();
}

/**
 * Практика дня меняется каждые сутки. Номер типа сдвигает очередь,
 * чтобы у разных типов в один день были разные практики.
 */
export function pickDailyPractice(
  practices: DailyPractice[],
  elementId: ElementId,
  typeNumber: number,
  date: Date,
): DailyPractice | undefined {
  const list = practices.filter((p) => p.elementId === elementId);
  if (list.length === 0) return undefined;
  return list[(getDayNumber(date) + typeNumber) % list.length];
}

export function filterRituals(rituals: WeeklyRitual[], elementId: ElementId): WeeklyRitual[] {
  return rituals.filter((r) => r.elementId === elementId);
}

export const practiceActions = {
  addPractice(practice: DailyPractice) {
    store.update((s) => ({ ...s, practices: [...s.practices, practice] }));
  },
  removePractice(id: string) {
    store.update((s) => ({ ...s, practices: s.practices.filter((p) => p.id !== id) }));
  },
  addRitual(ritual: WeeklyRitual) {
    store.update((s) => ({ ...s, rituals: [...s.rituals, ritual] }));
  },
  removeRitual(id: string) {
    store.update((s) => ({ ...s, rituals: s.rituals.filter((r) => r.id !== id) }));
  },
  reset() {
    store.reset();
  },
};
