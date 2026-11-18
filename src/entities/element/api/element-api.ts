import type { Element, ElementGuide, ElementId } from "../model/types";

// Демо-данные. Прототип собран под стихию Воды (запуск программы – 1 декабря).
const elements: Element[] = [
  {
    id: "wood",
    name: "Дерево",
    genitive: "Дерева",
    season: "Весна",
    period: "март – май",
    tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
    hasContent: false,
  },
  {
    id: "fire",
    name: "Огонь",
    genitive: "Огня",
    season: "Лето",
    period: "июнь – август",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-200",
    hasContent: false,
  },
  {
    id: "earth",
    name: "Земля",
    genitive: "Земли",
    season: "Ранняя осень",
    period: "с 1 сентября до перехода на Металл",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
    hasContent: false,
  },
  {
    id: "metal",
    name: "Металл",
    genitive: "Металла",
    season: "Поздняя осень",
    period: "с перехода до 30 ноября",
    tone: "bg-slate-200 text-slate-800 dark:bg-slate-800 dark:text-slate-100",
    hasContent: false,
  },
  {
    id: "water",
    name: "Вода",
    genitive: "Воды",
    season: "Зима",
    period: "1 декабря – 1 марта",
    tone: "bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200",
    hasContent: true,
  },
];

const guides: ElementGuide[] = [
  {
    elementId: "water",
    title: "Стихия Воды",
    summary: "Почки, воля и бережное отношение к запасу жизненной энергии.",
    videoTitle: "Видео по стихии Воды",
    videoDuration: "",
    text: [
      "Активные органы – почки, мочеполовая система, кости и уши.",
      "Уши сами по себе не болят: любая боль в них – сигнал о нехватке энергии в почках. Причём сигналы идут перекрёстно: левое ухо говорит о правой почке, правое – о левой.",
      "Почки – один из самых важных органов. Это наш жизненный аккумулятор. В них хранится весь запас жизненной энергии, который мы получаем при рождении от Земли, Космоса и родителей. Этот запас называют «неприкосновенным Ци». Именно от него во многом зависит продолжительность жизни. Если этот ресурс будет исчерпан слишком рано, жизнь в теле может завершиться, даже если остальные органы ещё в порядке.",
      "Главные причины быстрой потери «неприкосновенного Ци»:",
      "• Страх\n• Невежественный секс\n• Все виды привязанностей и зависимостей (ведь они тоже основаны на страхе потери)",
      "Качества, которые особенно важно развивать в Стихии Воды:",
      "• Воля\n• Усердие\n• Дисциплина\n• Нежность\n• Мягкость\n• Кротость\n• Щедрость\n• Благородство",
      "Почки и мочевой пузырь первыми подают сигналы, когда мы слишком долго держим напряжение и не даём эмоциям мягко протекать.",
      "Позвольте себе чуть меньше контролировать и чуть больше чувствовать – и Стихия Воды начнёт мягко вас поддерживать.",
    ].join("\n\n"),
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

/** Активная стихия в прототипе. С 1 декабря – Вода (см. period у элемента). */
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
