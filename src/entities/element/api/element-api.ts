import type { Element, ElementGuide, ElementId } from "../model/types";

// Демо-данные. Прототип собран под стихию Воды (запуск программы — 1 декабря).
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
    hasContent: false,
  },
  {
    id: "water",
    name: "Вода",
    season: "Зима",
    period: "декабрь — январь",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    hasContent: true,
  },
];

const guides: ElementGuide[] = [
  {
    elementId: "water",
    title: "Вода: покой, почки и внутренняя опора",
    videoTitle: "Вводное слово о даосской стихии Воды",
    videoDuration: "20 мин",
    text: "В даосской пятёрке стихий Вода — зима, Север, глубина и сила почек. Её эмоция — страх, которому на смену приходит мудрость, если мы не форсируем себя. Сейчас полезны тишина, согревание, мягкое движение и практики вроде внутренней улыбки.",
    books: [
      { title: "Дао дэ цзин", author: "Лао-цзы" },
      { title: "Цигун для начинающих", author: "Мантак Чиа" },
      { title: "Путь воды", author: "Джон А. Дейвис" },
    ],
    films: [
      { title: "Весна, лето, осень, зима… и снова весна", year: 2003 },
      { title: "Путь домой", year: 2019 },
    ],
  },
];

/** Активная стихия в прототипе. С 1 декабря — Вода (см. period у элемента). */
export const currentElementId: ElementId = "water";

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
