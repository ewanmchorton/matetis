// Экраны админки на опубликованном сайте: сервера нет, поэтому примеры лежат здесь.
// Тексты взяты из программы-примера и страницы Воды, люди – из прототипа «Вместе».
import { getElementGuide, getElements, type ElementId } from "@/entities/element";
import { readableBooks } from "@/entities/library/model/readable-books";
import { getPersonType } from "@/entities/person-type";
import { demoProgram } from "@/entities/program/model/demo-program";

const amounts = { "1": 2000, "3": 1000, "12": null };

export function previewElementPages() {
  const guide = getElementGuide("water");
  return getElements().map((element) => ({
    id: element.id,
    videoUrl: null as string | null,
    body: element.id === "water" ? (guide?.text ?? "") : "",
    books:
      element.id === "water"
        ? (guide?.books ?? [])
            .filter((book) => book.title === "Дао дэ цзин" || book.title === "Цигун для начинающих")
            .map((book, index) => ({
              id: `water-book-${index}`,
              title: book.title,
              author: book.author,
              year: null as number | null,
              coverUrl: null as string | null,
            }))
        : [],
    films:
      element.id === "water"
        ? (guide?.films ?? [])
            .filter((film) => film.title.startsWith("Весна, лето, осень, зима"))
            .map((film, index) => ({
              id: `water-film-${index}`,
              title: film.title,
              author: null as string | null,
              year: film.year,
              coverUrl: null as string | null,
            }))
        : [],
  }));
}

export function previewLibraryPractices() {
  return [
    { id: "welcome", title: "Приветственное видео", kind: "video" as const, body: "", videoUrl: null, hasAudio: false },
    { id: "cushion", title: "Золотая подушечка", kind: "audio" as const, body: "", videoUrl: null, hasAudio: false },
    { id: "sphere", title: "Техника Золотого Шара", kind: "audio" as const, body: "", videoUrl: null, hasAudio: false },
  ];
}

export function previewReadableBooks() {
  return readableBooks.map((book) => ({
    id: book.id,
    title: book.title,
    author: book.author,
    format: book.format,
    ready: Boolean(book.published),
    coverUrl: null as string | null,
  }));
}

export function previewElementPictures() {
  return getElements().map((element) => ({
    elementId: element.id as ElementId,
    main: null,
    practice: [] as { id: string; url: string; position: number }[],
  }));
}

export const previewCalendar = {
  elementId: "metal" as const,
  metalYear: 2026,
  metalStartsOn: null as string | null,
};

export function previewSectionPractices() {
  const program = demoProgram();
  const meditation = program.weekly.find((item) => item.title === "Медитация на качество силы");
  const awareness = program.awareness[0];
  return [
    {
      id: "meditation",
      title: "Медитация на качество силы",
      frequency: "weekly" as const,
      variants: [
        {
          id: "meditation-healer",
          position: 1,
          title: null,
          body: meditation?.body ?? "",
          videoUrl: null,
          typeIds: ["t1"],
          weakElement: null,
          seasonElement: null,
          spanWeeks: null,
        },
      ],
    },
    {
      id: "awareness-book",
      title: "Осознание по книге «2 жизни»",
      frequency: "awareness" as const,
      variants: [
        {
          id: "awareness-healer",
          position: 1,
          title: null,
          body: awareness?.body ?? "",
          videoUrl: null,
          typeIds: ["t1"],
          weakElement: null,
          seasonElement: null,
          spanWeeks: null,
        },
      ],
    },
  ];
}

export function previewDailyPractices() {
  const program = demoProgram();
  const smile = program.morning.find((item) => item.id === "smile");
  const thinking = program.evening.find((item) => item.id === "example");
  const row = (
    id: string,
    title: string,
    daypart: "morning" | "evening",
    position: number,
    body = "",
  ) => ({
    id,
    title,
    frequency: "daily" as const,
    daypart,
    position,
    body,
    videoUrl: null,
    opensOnDay: 1,
    spanWeeks: null,
    alternation: null,
    allowTogether: true,
    variants: [] as {
      body: string;
      videoUrl: string | null;
      typeIds: string[];
      weakElement: ElementId | null;
      seasonElement: ElementId | null;
      spanWeeks: number | null;
    }[],
  });
  return [
    row("smile", "Внутренняя улыбка", "morning", 1, smile?.body ?? ""),
    row("soul", "Линия души", "morning", 2),
    row("mini", "Мини-зарядка", "morning", 3),
    row("sounds", "Целительные звуки", "evening", 1),
    row("thinking", "Мышление по навигатору дня", "evening", 2, thinking?.body ?? ""),
  ];
}

export function previewNavigatorMessages() {
  const navigator = demoProgram().navigator;
  const part = navigator?.kind === "part" ? navigator.parts[0] : null;
  if (!navigator || navigator.kind !== "part" || !part) return [];
  return [
    {
      id: navigator.messageId,
      title: navigator.title,
      masterName: navigator.masterName ?? "",
      givenOn: navigator.givenOn ?? "",
      intro: navigator.intro ?? "",
      closing: navigator.closing ?? "",
      position: 1,
      day7Task: navigator.task,
      typeIds: ["t1"],
      parts: [1, 2, 3].map((number) =>
        number === 1
          ? { part: number, title: part.title, body: part.body, firstDayTask: navigator.task, secondDayTask: "" }
          : { part: number, title: "", body: "", firstDayTask: "", secondDayTask: "" },
      ),
    },
  ];
}

export function previewPhrases() {
  return [
    {
      id: "plato",
      text: "Стараясь осчастливить других, мы находим своё собственное (Платон)",
      typeIds: [] as string[],
      createdAt: "2026-11-01T00:00:00.000Z",
    },
  ];
}

export function previewMatetis() {
  return [
    {
      contact: "Марина",
      name: "Марина",
      status: { kind: "active" as const, until: "2026-12-25", daysLeft: 30, expiring: false },
    },
    { contact: "Павел", name: "Павел", status: { kind: "request" as const } },
    {
      contact: "Светлана",
      name: "Светлана",
      status: { kind: "active" as const, until: "2026-11-28", daysLeft: 3, expiring: true },
    },
  ];
}

export function previewAccessCard(contact: string) {
  const person = previewMatetis().find((item) => item.contact === contact) ?? previewMatetis()[0];
  return {
    contact: person.contact,
    name: person.name,
    status: person.status,
    userId: person.contact,
    role: "user" as const,
    periods: [],
    suggestedAmounts: amounts,
  };
}

export function previewPerson() {
  const healer = getPersonType("t1");
  return {
    birthReading: null,
    typeHistory: healer ? [{ takenAt: "2026-11-01T00:00:00.000Z", type: healer }] : [],
  };
}
