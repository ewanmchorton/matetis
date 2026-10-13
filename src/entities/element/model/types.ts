export type ElementId = "wood" | "fire" | "earth" | "metal" | "water";

export type Element = {
  id: ElementId;
  name: string;
  season: string;
  period: string;
  /** Tailwind-классы для цветовой метки стихии */
  tone: string;
  hasContent: boolean;
};

export type ElementGuide = {
  elementId: ElementId;
  title: string;
  /** Одна-две строки на главной, полный текст — в карточке */
  summary: string;
  videoTitle: string;
  videoDuration: string;
  text: string;
  books: { title: string; author: string }[];
  films: { title: string; year: number }[];
};
