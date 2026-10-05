export type Book = {
  id: string;
  title: string;
  author: string;
  format: "PDF" | "Скан (изображения)";
  pages: number;
  downloadable: boolean;
  /** Tailwind-градиент для обложки-заглушки */
  cover: string;
};
