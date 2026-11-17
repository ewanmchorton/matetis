import type { FeedItem, InviteOptions, SuggestedPerson, Together } from "@/entities/together/server";

/** Состояния вкладки, как в макете дизайнера. Только для сайта без сервера. */
export const demoKinds = [
  "invite",
  "active",
  "waiting",
  "monthly",
  "monthly-stranger",
  "completed",
  "quiet",
  "people",
] as const;

export type DemoKind = (typeof demoKinds)[number];

export function isDemoKind(value: string | null): value is DemoKind {
  return demoKinds.some((kind) => kind === value);
}

const practice = { id: "loyalty", title: "Медитация на качество «Верность»" };
const marina = { id: "marina", name: "Марина", companionStage: 2, isFriend: true };
const pavel = { id: "pavel", name: "Павел", companionStage: 5, isFriend: false };

const feed: FeedItem[] = [
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
];

const people: SuggestedPerson[] = [
  { id: "marina", name: "Марина", companionStage: 2, friendship: "none" },
  { id: "igor", name: "Игорь", companionStage: 3, friendship: "none" },
  { id: "svetlana", name: "Светлана", companionStage: 4, friendship: "none" },
  { id: "denis", name: "Денис", companionStage: 6, friendship: "none" },
];

/** Какое состояние показать. Без параметра – приглашение, как на первом макете. */
export function demoTogether(kind: DemoKind = "invite"): Together {
  const withFeed = { hasFriends: true, feed, people: [] as SuggestedPerson[] };
  if (kind === "quiet") return { card: null, canInvite: true, ...withFeed };
  if (kind === "people") return { card: null, canInvite: false, hasFriends: false, feed: [], people };
  if (kind === "active") {
    return {
      ...withFeed,
      canInvite: false,
      card: {
        id: "demo-active",
        kind: "active",
        practice,
        partner: marina,
        startsOn: "2026-11-18",
        endsOn: "2026-11-24",
        myDone: false,
        partnerDone: true,
      },
    };
  }
  if (kind === "waiting") {
    return {
      ...withFeed,
      canInvite: false,
      card: { id: "demo-waiting", kind: "outgoing", practice, partner: marina, answerBy: "2099-01-01T00:00:00.000Z" },
    };
  }
  if (kind === "monthly" || kind === "monthly-stranger") {
    return {
      ...withFeed,
      canInvite: false,
      card: {
        id: "demo-monthly",
        kind: "monthly",
        practice,
        partner: kind === "monthly" ? marina : pavel,
        iAccepted: false,
        answerBy: "2099-01-01T00:00:00.000Z",
      },
    };
  }
  if (kind === "completed") {
    return {
      ...withFeed,
      canInvite: true,
      card: { id: "demo-completed", kind: "completed", practice, partner: marina },
    };
  }
  return {
    ...withFeed,
    canInvite: false,
    card: { id: "demo-invite", kind: "incoming", practice, partner: marina, answerBy: "2099-01-01T00:00:00.000Z" },
  };
}

const demoFriends = [
  { id: "marina", name: "Марина", companionStage: 2, busy: false },
  { id: "igor", name: "Игорь", companionStage: 3, busy: true },
  { id: "svetlana", name: "Светлана", companionStage: 4, busy: false },
  { id: "denis", name: "Денис", companionStage: 6, busy: false },
];

const demoPractices = [practice, { id: "smile", title: "Внутренняя улыбка" }];

export function demoOptions(friendId?: string): InviteOptions {
  const friend = demoFriends.find((item) => item.id === friendId);
  return { friends: demoFriends, practices: friend && !friend.busy ? demoPractices : [] };
}
