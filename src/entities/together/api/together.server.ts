// Данные вкладки «Вместе» и что делать после отметки практики. Только серверный код.
import { listFriends } from "@/entities/friendship/server";

import { listFeed, recordPracticeEvents, suggestPeople, type FeedItem, type SuggestedPerson } from "./feed.server";
import { completeJointIfDone, getMyJointCard, markJoint, type JointCard } from "./joint.server";

export type Together = {
  card: JointCard | null;
  /** Можно предложить практику: есть друзья и нет открытой совместной практики. */
  canInvite: boolean;
  hasFriends: boolean;
  feed: FeedItem[];
  /** Только когда друзей нет. */
  people: SuggestedPerson[];
};

export async function getTogether(userId: string, now = new Date()): Promise<Together> {
  const card = await getMyJointCard(userId, now);
  const [friends, feed] = await Promise.all([listFriends(userId), listFeed(userId, now)]);
  const hasFriends = friends.length > 0;
  const open = card !== null && card.kind !== "completed";
  return {
    card,
    canInvite: hasFriends && !open,
    hasFriends,
    feed,
    people: hasFriends ? [] : await suggestPeople(userId, now),
  };
}

/** Вызывать после того, как человек отметил практику: события ленты и завершение совместной. */
export async function afterPracticeMarked(userId: string, now = new Date()) {
  await recordPracticeEvents(userId, now);
  await completeJointIfDone(userId, now);
}

/** Отметка на карточке совместной практики: та же отметка в программе, события и завершение. */
export async function markJointPractice(userId: string, jointId: unknown, done: boolean, now = new Date()) {
  await markJoint(userId, jointId, done, now);
  if (done) await afterPracticeMarked(userId, now);
  return { ok: true };
}
