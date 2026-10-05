import type { ElementId } from "@/entities/element";
import { getDayNumber } from "@/shared/lib/date";

import type { DailyPractice, WeeklyRitual } from "../model/types";

// Демо-данные стихии Воды (даосская пятерка, запуск 1 декабря).
const dailyPractices: DailyPractice[] = [
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

const weeklyRituals: WeeklyRitual[] = [
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
