import type { ElementId } from "@/entities/element";

export type DailyPractice = {
  id: string;
  elementId: ElementId;
  title: string;
  duration: string;
  steps: string[];
  /** Короткое пояснение, зачем эта практика в текущую стихию */
  why: string;
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
