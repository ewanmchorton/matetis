import type { ElementId } from "@/entities/element";

export type LibraryVideo = {
  id: string;
  /** К какой стихии относится материал (если применимо) */
  elementId?: ElementId;
  title: string;
  duration: string;
  kind: "intro" | "lesson";
};

export type LibraryMeditation = {
  id: string;
  elementId?: ElementId;
  title: string;
  duration: string;
};

export type LibraryBook = {
  id: string;
  elementId?: ElementId;
  title: string;
  author: string;
};

export type LibraryFilm = {
  id: string;
  elementId?: ElementId;
  title: string;
  year: number;
};
