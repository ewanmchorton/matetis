import type { ElementId } from "@/entities/element";

export type DailyPractice = {
  id: string;
  elementId: ElementId;
  title: string;
  duration: string;
  steps: string[];
  /** Короткое пояснение, зачем эта практика в текущую стихию */
  why: string;
  /**
   * Можно предложить другу. По умолчанию да.
   * В админке для отдельных практик совместный формат выключают.
   */
  allowTogether?: boolean;
};

/** Практика не сезона, а «слабой» стихии — дополнение к основной программе. */
export type SupportPractice = {
  id: string;
  elementId: ElementId;
  title: string;
  duration: string;
  note: string;
};

/** «daily» — можно отмечать каждый день; «once_per_week» — одна отметка на неделю */
export type WeeklyRitualSchedule = "daily" | "once_per_week";

export type WeeklyRitual = {
  id: string;
  elementId: ElementId;
  title: string;
  description: string;
  schedule: WeeklyRitualSchedule;
};
