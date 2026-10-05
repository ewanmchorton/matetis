import type { Element, ElementGuide, ElementId } from "../model/types";

// Демо-данные. Даты и порядок стихий условные — уточняются у Мастера.
const elements: Element[] = [
  {
    id: "wood",
    name: "Дерево",
    season: "Весна",
    period: "февраль — апрель",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    hasContent: false,
  },
  {
    id: "fire",
    name: "Огонь",
    season: "Лето",
    period: "май — июль",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    hasContent: false,
  },
  {
    id: "earth",
    name: "Земля",
    season: "Ранняя осень",
    period: "август — сентябрь",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    hasContent: false,
  },
  {
    id: "metal",
    name: "Металл",
    season: "Поздняя осень",
    period: "октябрь — ноябрь",
    tone: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    hasContent: true,
  },
  {
    id: "water",
    name: "Вода",
    season: "Зима",
    period: "декабрь — январь",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    hasContent: false,
  },
];

const guides: ElementGuide[] = [
  {
    elementId: "metal",
    title: "Металл: время собирать и отпускать",
    videoTitle: "Вводное слово Мастера о стихии Металла",
    videoDuration: "18 мин",
    text: "Металл — время ясности, структуры и завершения. В этот период полезно разбирать накопленное, отпускать лишнее и выстраивать ритм. Обратите внимание на дыхание: практики этой стихии во многом построены вокруг него.",
    books: [
      { title: "Дао дэ цзин", author: "Лао-цзы" },
      { title: "Искусство жить", author: "Тит Нат Хан" },
      { title: "Тело помнит всё", author: "Бессел ван дер Колк" },
    ],
    films: [
      { title: "Весна, лето, осень, зима… и снова весна", year: 2003 },
      { title: "Идеальные дни", year: 2023 },
    ],
  },
];

export const currentElementId: ElementId = "metal";

export function getElements(): Element[] {
  return elements;
}

export function getElement(id: ElementId): Element {
  const element = elements.find((e) => e.id === id);
  if (!element) throw new Error(`Unknown element: ${id}`);
  return element;
}

export function getCurrentElement(): Element {
  return getElement(currentElementId);
}

export function getElementGuide(id: ElementId): ElementGuide | undefined {
  return guides.find((g) => g.elementId === id);
}
