import type { ElementId } from "@/entities/element";

export type LibraryItemKind = "video" | "meditation" | "book" | "film";

export type LibraryItem = {
  id: string;
  kind: LibraryItemKind;
  title: string;
  /** К какой стихии относится материал (необязательно) */
  elementId?: ElementId;
  /** Для видео и медитаций, например «15 мин» */
  duration?: string;
  /** Для книг */
  author?: string;
  /** Для фильмов */
  year?: number;
  /** Имя загруженного файла (в прототипе сам файл никуда не отправляется) */
  fileName?: string;
};

export const libraryKindLabels: Record<LibraryItemKind, string> = {
  video: "Видео",
  meditation: "Медитация",
  book: "Книга",
  film: "Фильм",
};
