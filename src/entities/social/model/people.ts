import type { DemoPerson, FeedEvent } from "./types";

export const people: DemoPerson[] = [
  {
    id: "marina",
    name: "Марина",
    about: "В программе стихии Воды",
    unavailablePracticeIds: [],
  },
  {
    id: "igor",
    name: "Игорь",
    about: "В программе стихии Воды",
    unavailablePracticeIds: [],
  },
  {
    id: "svetlana",
    name: "Светлана",
    about: "В программе стихии Воды",
    unavailablePracticeIds: [],
  },
  {
    id: "denis",
    name: "Денис",
    about: "В программе стихии Воды",
    unavailablePracticeIds: ["water-koan-day"],
  },
  {
    id: "olga",
    name: "Ольга",
    about: "Хочет добавить вас в друзья",
    unavailablePracticeIds: [],
  },
  {
    id: "pavel",
    name: "Павел",
    about: "Пока не в списке друзей",
    unavailablePracticeIds: [],
  },
];

export function getPerson(id: string): DemoPerson | undefined {
  return people.find((person) => person.id === id);
}

/** Значимые события. Пропуски, рейтинги и комментарии в ленту не попадают. */
export const feedEvents: FeedEvent[] = [
  {
    id: "e-first",
    personId: "svetlana",
    kind: "first",
    title: "Первая практика",
    text: "Светлана выполнила первую практику — «Коан дня».",
  },
  {
    id: "e-week",
    personId: "igor",
    kind: "week",
    title: "Несколько дней за неделю",
    text: "Игорь практиковал несколько дней на этой неделе.",
  },
  {
    id: "e-together",
    personId: "marina",
    kind: "together",
    title: "Совместная практика",
    text: "Марина завершила совместную практику вместе с Игорем.",
  },
  {
    id: "e-return",
    personId: "denis",
    kind: "return",
    title: "Снова в практике",
    text: "Денис выполнил практику после перерыва больше недели.",
  },
];
