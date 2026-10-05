import type { ElementId } from "@/entities/element";
import { getDayNumber } from "@/shared/lib/date";

import type { DailyPractice, WeeklyRitual } from "../model/types";

// Демо-данные стихии Воды (запуск 1 декабря). Настоящие практики пришлёт Мастер.
const dailyPractices: DailyPractice[] = [
  {
    id: "water-warm-feet",
    elementId: "water",
    title: "Тёплые ноги перед сном",
    duration: "15 минут",
    steps: [
      "Налейте тёплую (не горячую) воду в таз.",
      "Окуните ступни на 10–12 минут, дышите спокойно.",
      "Высушите ноги и наденьте тёплые носки.",
    ],
    why: "Зима — время беречь тепло в теле. Тёплые ноги помогают расслабиться и легче уснуть.",
  },
  {
    id: "water-evening-breath",
    elementId: "water",
    title: "Вечернее дыхание «волна»",
    duration: "8 минут",
    steps: [
      "Лягте или сядьте удобно, закройте глаза.",
      "На вдохе представьте, что тепло поднимается снизу вверх.",
      "На выдохе — будто волна мягко уходит и уносит напряжение.",
    ],
    why: "Вода учит не держать лишнее внутри — дыхание помогает отпустить день.",
  },
  {
    id: "water-early-lights",
    elementId: "water",
    title: "Приглушить свет за час до сна",
    duration: "5 минут",
    steps: [
      "За час до сна уберите яркий свет в комнате.",
      "Выключите лишние экраны или включите ночной режим.",
      "Сделайте три медленных вдоха и выдоха.",
    ],
    why: "Зимой телу важен ритм сна — темнота и тишина накапливают силы.",
  },
  {
    id: "water-warm-drink",
    elementId: "water",
    title: "Тёплый напиток без телефона",
    duration: "10 минут",
    steps: [
      "Заварите тёплый чай или воду с лимоном.",
      "Сядьте в тишине, телефон отложите в сторону.",
      "Пейте маленькими глотками, замечая тепло и вкус.",
    ],
    why: "Спокойный ритуал согревает и возвращает внимание в тело — это опора стихии Воды.",
  },
  {
    id: "water-back-stretch",
    elementId: "water",
    title: "Мягкая растяжка поясницы",
    duration: "7 минут",
    steps: [
      "Встаньте, ноги на ширине плеч.",
      "Медленно наклонитесь вперёд, колени можно чуть согнуть.",
      "Покачайтесь из стороны в сторону и выпрямитесь без рывка.",
    ],
    why: "Вода связана с глубиной и опорой — поясница благодарит за бережное движение.",
  },
  {
    id: "water-fear-journal",
    elementId: "water",
    title: "Записать и отпустить тревогу",
    duration: "10 минут",
    steps: [
      "Запишите одну мысль, которая тревожит сегодня.",
      "Под ней — что вы можете сделать завтра, а что не в вашей власти.",
      "Закройте блокнот и скажите себе: «На сегодня достаточно».",
    ],
    why: "Зимой чаще всплывают страхи — выписать их на бумагу легче, чем крутить в голове.",
  },
  {
    id: "water-slow-walk",
    elementId: "water",
    title: "Медленная прогулка в тишине",
    duration: "20 минут",
    steps: [
      "Оденьтесь тепло и выйдите на 15–20 минут.",
      "Идите медленнее обычного, без музыки.",
      "Замечайте дыхание и звуки вокруг.",
    ],
    why: "Свежий зимний воздух и движение без спешки укрепляют и успокаивают.",
  },
];

const weeklyRituals: WeeklyRitual[] = [
  {
    id: "water-sleep-ritual",
    elementId: "water",
    title: "Лечь до 23:00",
    description: "Без экрана в последние 30 минут перед сном",
    timesPerWeek: 5,
  },
  {
    id: "water-meditation",
    elementId: "water",
    title: "Медитация «Глубина»",
    description: "15 минут вечером, по аудио Мастера",
    timesPerWeek: 3,
  },
  {
    id: "water-warm-bath",
    elementId: "water",
    title: "Тёплая ванна или душ",
    description: "20 минут расслабления, 1 раз в неделю",
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
