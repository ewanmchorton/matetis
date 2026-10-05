export type Material = {
  id: string;
  title: string;
  format: "PDF" | "Аудио" | "Видео";
  /** Размер файла или длительность записи */
  size: string;
  description: string;
};
