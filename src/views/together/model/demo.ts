import type { InviteOptions, Together } from "@/entities/together/server";

/** То, что видно на GitHub Pages, где нет сервера: приглашение и события, как в макете. */
export function demoTogether(): Together {
  return {
    card: {
      id: "demo-invite",
      kind: "incoming",
      answerBy: "2099-01-01T00:00:00.000Z",
      practice: { id: "loyalty", title: "Медитация на качество «Верность»" },
      partner: { id: "marina", name: "Марина", companionStage: 2, isFriend: true },
    },
    canInvite: false,
    hasFriends: true,
    feed: [
      {
        id: "demo-first",
        kind: "first_practice",
        createdAt: "2026-11-17T12:00:00.000Z",
        author: { id: "svetlana", name: "Светлана", companionStage: 4 },
        partner: null,
        supported: false,
      },
      {
        id: "demo-joint",
        kind: "joint_completed",
        createdAt: "2026-11-16T12:00:00.000Z",
        author: { id: "marina", name: "Марина", companionStage: 2 },
        partner: { id: "igor", name: "Игорь" },
        supported: false,
      },
      {
        id: "demo-back",
        kind: "comeback",
        createdAt: "2026-11-15T12:00:00.000Z",
        author: { id: "denis", name: "Денис", companionStage: 6 },
        partner: null,
        supported: false,
      },
    ],
    people: [],
  };
}

const demoFriends = [
  { id: "marina", name: "Марина", companionStage: 2, busy: false },
  { id: "igor", name: "Игорь", companionStage: 3, busy: true },
  { id: "svetlana", name: "Светлана", companionStage: 4, busy: false },
  { id: "denis", name: "Денис", companionStage: 6, busy: false },
];

const demoPractices = [
  { id: "loyalty", title: "Медитация на качество «Верность»" },
  { id: "smile", title: "Внутренняя улыбка" },
];

export function demoOptions(friendId?: string): InviteOptions {
  const friend = demoFriends.find((item) => item.id === friendId);
  return { friends: demoFriends, practices: friend && !friend.busy ? demoPractices : [] };
}
