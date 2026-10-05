import type { Book } from "../model/types";

const books: Book[] = [
  {
    id: "b1",
    title: "Пять стихий в повседневной жизни",
    author: "Мастер",
    format: "PDF",
    pages: 148,
    downloadable: true,
    cover: "from-amber-200 to-orange-400",
  },
  {
    id: "b2",
    title: "Дыхание и внимание",
    author: "Мастер",
    format: "Скан (изображения)",
    pages: 64,
    downloadable: false,
    cover: "from-sky-200 to-indigo-400",
  },
  {
    id: "b3",
    title: "Дневник практик: осень",
    author: "Мастер",
    format: "PDF",
    pages: 32,
    downloadable: true,
    cover: "from-stone-200 to-stone-500",
  },
  {
    id: "b4",
    title: "Двенадцать путей",
    author: "Мастер",
    format: "PDF",
    pages: 210,
    downloadable: false,
    cover: "from-emerald-200 to-teal-500",
  },
];

export function getBooks(): Book[] {
  return books;
}

export function getBook(id: string): Book | undefined {
  return books.find((b) => b.id === id);
}
