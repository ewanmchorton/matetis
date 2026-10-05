import type { ElementId } from "@/entities/element";

import type { DailyPractice, WeeklyRitual } from "../model/types";

// Демо-данные стихии Воды (даосская пятерка, запуск 1 декабря). Тексты уточняет Мастер.
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
];

const weeklyRituals: WeeklyRitual[] = [
  {
    id: "water-tuata-charge",
    elementId: "water",
    title: "Зарядка «Туата»",
    description: "Короткий комплекс по методике Мастера — каждый день, когда получается",
    schedule: "daily",
  },
  {
    id: "water-weekly-audio",
    elementId: "water",
    title: "Практика стихии Воды с аудио",
    description: "Один раз за неделю, 25–30 минут по записи Мастера",
    schedule: "once_per_week",
  },
  {
    id: "water-kidney-care",
    elementId: "water",
    title: "Мягкое согревание поясницы",
    description: "Раз в неделю: тёплый пояс или компресс на поясницу, 15 минут в тишине",
    schedule: "once_per_week",
  },
];

export function getDailyPractice(elementId: ElementId): DailyPractice | undefined {
  return dailyPractices.find((p) => p.elementId === elementId);
}

export function getWeeklyRituals(elementId: ElementId): WeeklyRitual[] {
  return weeklyRituals.filter((r) => r.elementId === elementId);
}
