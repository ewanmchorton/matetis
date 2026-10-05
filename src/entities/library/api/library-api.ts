import type { ElementId } from "@/entities/element";
import { getElementGuide } from "@/entities/element";

import type { LibraryMeditation, LibraryVideo } from "../model/types";

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

export function getLibraryVideos(elementId: ElementId): LibraryVideo[] {
  return videos.filter((v) => v.elementId === elementId);
}

export function getLibraryMeditations(elementId: ElementId): LibraryMeditation[] {
  return meditations.filter((m) => m.elementId === elementId);
}

export function getLibraryBooksAndFilms(elementId: ElementId) {
  const guide = getElementGuide(elementId);
  return {
    books: guide?.books ?? [],
    films: guide?.films ?? [],
    introText: guide?.text,
  };
}
