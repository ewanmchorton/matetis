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

export type WeeklyRitual = {
  id: string;
  elementId: ElementId;
  title: string;
  description: string;
  timesPerWeek: number;
};
