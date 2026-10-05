import type { LibraryBook, LibraryFilm, LibraryMeditation, LibraryVideo } from "../model/types";

// Каталог материалов, которые реально есть в прототипе (без «библиотек по стихиям»).
const videos: LibraryVideo[] = [
  {
    id: "water-intro",
    elementId: "water",
    title: "Вводное слово о даосской стихии Воды",
    duration: "20 мин",
    kind: "intro",
  },
  {
    id: "water-lesson-1",
    elementId: "water",
    title: "Урок 1. Почки, покой и внутренняя опора",
    duration: "14 мин",
    kind: "lesson",
  },
  {
    id: "water-lesson-2",
    elementId: "water",
    title: "Урок 2. Страх, мудрость и внутренняя улыбка",
    duration: "16 мин",
    kind: "lesson",
  },
];

const meditations: LibraryMeditation[] = [
  {
    id: "water-meditation-deep",
    elementId: "water",
    title: "Медитация «Глубина»",
    duration: "15 мин",
  },
  {
    id: "water-meditation-night",
    elementId: "water",
    title: "Медитация перед сном",
    duration: "12 мин",
  },
];

const books: LibraryBook[] = [
  { id: "book-tao", elementId: "water", title: "Дао дэ цзин", author: "Лао-цзы" },
  { id: "book-qigong", elementId: "water", title: "Цигун для начинающих", author: "Мантак Чиа" },
  { id: "book-water-path", elementId: "water", title: "Путь воды", author: "Джон А. Дейвис" },
];

const films: LibraryFilm[] = [
  {
    id: "film-seasons",
    elementId: "water",
    title: "Весна, лето, осень, зима… и снова весна",
    year: 2003,
  },
  { id: "film-way-home", elementId: "water", title: "Путь домой", year: 2019 },
];

export function getLibraryVideos(): LibraryVideo[] {
  return videos;
}

export function getLibraryMeditations(): LibraryMeditation[] {
  return meditations;
}

export function getLibraryBooks(): LibraryBook[] {
  return books;
}

export function getLibraryFilms(): LibraryFilm[] {
  return films;
}
