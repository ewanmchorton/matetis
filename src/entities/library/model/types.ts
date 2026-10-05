import type { ElementId } from "@/entities/element";

export type LibraryVideo = {
  id: string;
  elementId: ElementId;
  title: string;
  duration: string;
  kind: "intro" | "lesson";
};

export type LibraryMeditation = {
  id: string;
  elementId: ElementId;
  title: string;
  duration: string;
};
