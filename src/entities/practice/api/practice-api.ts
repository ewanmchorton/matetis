import type { ElementId } from "@/entities/element";
import { getDayNumber } from "@/shared/lib/date";

import type { DailyPractice, WeeklyRitual } from "../model/types";

// Демо-данные. Настоящие практики и ритуалы пришлёт Мастер.
const dailyPractices: DailyPractice[] = [
  {
    id: "metal-breath-4-4",
    elementId: "metal",
    title: "Дыхание на счёт «четыре — четыре»",
    duration: "7 минут",
    steps: [
      "Сядьте ровно, плечи опустите.",
      "Вдох на 4 счёта, выдох на 4 счёта.",
      "Повторите 20 раз, не торопясь.",
    ],
    why: "Металл связан с лёгкими: ровное дыхание помогает собраться и успокоить мысли.",
  },
  {
    id: "metal-let-go-list",
    elementId: "metal",
    title: "Список «что я отпускаю»",
    duration: "10 минут",
    steps: [
      "Возьмите лист бумаги.",
      "Запишите три вещи, которые больше не нужны: дела, обиды, привычки.",
      "Рядом с каждой напишите, что освободится, если её отпустить.",
    ],
    why: "Осень — время завершать и отпускать лишнее, чтобы освободить место новому.",
  },
  {
    id: "metal-one-shelf",
    elementId: "metal",
    title: "Разобрать одну полку",
    duration: "15 минут",
    steps: [
      "Выберите одну полку или ящик.",
      "Достаньте всё и верните только нужное.",
      "Лишнее отложите, чтобы отдать или выбросить.",
    ],
    why: "Порядок вокруг помогает навести порядок внутри — это главная тема Металла.",
  },
  {
    id: "metal-walk-silence",
    elementId: "metal",
    title: "Прогулка в тишине",
    duration: "20 минут",
    steps: [
      "Выйдите на улицу без наушников.",
      "Идите спокойно и замечайте запахи и звуки осени.",
      "В конце сделайте три глубоких вдоха.",
    ],
    why: "Свежий воздух и тишина укрепляют лёгкие и дают ясность.",
  },
  {
    id: "metal-gratitude",
    elementId: "metal",
    title: "Благодарность уходящему дню",
    duration: "5 минут",
    steps: [
      "Перед сном вспомните три хороших момента дня.",
      "Мысленно поблагодарите за каждый.",
      "Отпустите то, что не получилось, — завтра новый день.",
    ],
    why: "Металл учит ценить главное и спокойно завершать начатое.",
  },
  {
    id: "metal-posture",
    elementId: "metal",
    title: "Ровная спина",
    duration: "5 минут",
    steps: [
      "Встаньте у стены: затылок, лопатки и пятки касаются её.",
      "Постойте так минуту, дыша спокойно.",
      "Отойдите и сохраните это ощущение в течение дня.",
    ],
    why: "Прямая осанка раскрывает грудную клетку и делает дыхание свободнее.",
  },
  {
    id: "metal-one-task",
    elementId: "metal",
    title: "Одно дело до конца",
    duration: "30 минут",
    steps: [
      "Выберите одно давно отложенное небольшое дело.",
      "Уберите телефон и отвлечения.",
      "Доведите дело до конца и отметьте это.",
    ],
    why: "Завершённые дела дают силы — это энергия Металла.",
  },
];

const weeklyRituals: WeeklyRitual[] = [
  {
    id: "metal-morning-breath",
    elementId: "metal",
    title: "Утренняя дыхательная зарядка",
    description: "10 минут сразу после пробуждения",
    timesPerWeek: 5,
  },
  {
    id: "metal-meditation",
    elementId: "metal",
    title: "Медитация «Отпускание»",
    description: "15 минут вечером, по аудио Мастера",
    timesPerWeek: 3,
  },
  {
    id: "metal-space",
    elementId: "metal",
    title: "Разбор пространства",
    description: "Освободить одно место дома от лишнего",
    timesPerWeek: 1,
  },
];

/**
 * Практика дня меняется каждые сутки. Номер типа сдвигает очередь,
 * чтобы у разных типов в один день были разные практики.
 */
export function getDailyPractice(
  elementId: ElementId,
  typeNumber: number,
  date: Date,
): DailyPractice | undefined {
  const list = dailyPractices.filter((p) => p.elementId === elementId);
  if (list.length === 0) return undefined;
  return list[(getDayNumber(date) + typeNumber) % list.length];
}

export function getWeeklyRituals(elementId: ElementId): WeeklyRitual[] {
  return weeklyRituals.filter((r) => r.elementId === elementId);
}
