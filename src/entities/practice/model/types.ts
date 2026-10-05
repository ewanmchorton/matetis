import type { ElementId } from "@/entities/element";

export type PracticeKind = "daily" | "ritual" | "state";

export const practiceKindLabel: Record<PracticeKind, string> = {
  daily: "Ежедневная практика",
  ritual: "Еженедельный ритуал",
  state: "Практика по состоянию",
};

export type Practice = {
  id: string;
  kind: PracticeKind;
  title: string;
  summary: string;
  durationMin: number;
  /** Для практик программы. У практик «по состоянию» стихии нет. */
  elementId?: ElementId;
  /** Пустой список — практика подходит всем 12 типам. */
  typeIds: string[];
  steps: string[];
  hasImage: boolean;
  video?: { title: string; duration: string };
  /** Для ритуалов: в какой день недели рекомендуется */
  weekday?: string;
  /** Для практик по состоянию: категория в библиотеке */
  state?: string;
};
