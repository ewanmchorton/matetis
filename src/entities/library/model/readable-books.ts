/** Файл книги на диске. Скан – страницами, электронная книга – обычным текстом. */
export type BookFormat = "pdf" | "djvu" | "epub" | "fb2";

export type ReadableBook = {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  /** Имя файла в private/library-books. Остальные книги в git не входят. */
  file: string;
  /** Файл в public: его можно открыть и на опубликованном сайте-прототипе. */
  published?: string;
};

export const formatLabel: Record<BookFormat, string> = {
  pdf: "PDF",
  djvu: "DJVU",
  epub: "EPUB",
  fb2: "FB2",
};

/**
 * Примеры, на которых проверяем читалку. Список для локального запуска:
 * файлы лежат в private/library-books и с сервера разработки отдаются по id.
 */
export const readableBooks: ReadableBook[] = [
  {
    id: "antarova-epub",
    title: "Две жизни",
    author: "Конкордия Антарова",
    format: "epub",
    file: "antarova.epub",
    published: "samples/antarova.epub",
  },
  {
    id: "chia-love",
    title: "Даосские секреты любви",
    author: "Мантэк Чиа",
    format: "fb2",
    file: "chia-love.fb2",
  },
  {
    id: "chia-light-1",
    title: "Дао – Пробуждение света. Книга 1",
    author: "Мантэк Чиа",
    format: "pdf",
    file: "chia-light-1.pdf",
  },
  {
    id: "chia-light-2",
    title: "Дао – Пробуждение света. Книга 2",
    author: "Мантэк Чиа",
    format: "pdf",
    file: "chia-light-2.pdf",
  },
  {
    id: "chia-iron",
    title: "Цигун. Железная рубашка",
    author: "Мантэк Чиа",
    format: "djvu",
    file: "chia-iron.djvu",
  },
];

export function bookById(id: string) {
  return readableBooks.find((book) => book.id === id);
}
