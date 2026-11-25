// Лента событий друзей, «Поддержать» и подборка людей, когда друзей ещё нет. Только серверный код.
import { and, desc, eq, gt, inArray, isNull, lt, ne, notInArray, or, sql } from "drizzle-orm";

import { getPublicProfile, listFriends, type FriendshipStatus } from "@/entities/friendship/server";
import { getCompanionStages, todayFor } from "@/entities/program/server";
import { db, feedEvent, feedReaction, jointPracticeMember, practiceMark, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import { isComeback } from "../model/days";

export type FeedKind = (typeof feedEvent.$inferSelect)["kind"];

export type FeedItem = {
  id: string;
  kind: FeedKind;
  createdAt: string;
  author: { id: string; name: string; companionStage: number };
  /** С кем прошли совместную практику. */
  partner: { id: string; name: string } | null;
  /** Я уже поддержал. */
  supported: boolean;
};

const FEED_LIMIT = 50;
const PEOPLE_LIMIT = 5;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * После отметки практики: первая практика в жизни или возвращение после перерыва больше 7 дней.
 * Снятая потом отметка событие не убирает.
 */
export async function recordPracticeEvents(userId: string, now = new Date()) {
  const today = await todayFor(userId, now);
  const [previous] = await db
    .select({ day: practiceMark.day })
    .from(practiceMark)
    .where(and(eq(practiceMark.userId, userId), lt(practiceMark.day, today)))
    .orderBy(desc(practiceMark.day))
    .limit(1);
  if (!previous) {
    await db.insert(feedEvent).values({ userId, kind: "first_practice", createdAt: now }).onConflictDoNothing();
    return;
  }
  if (!isComeback(previous.day, today)) return;
  const [recent] = await db
    .select({ id: feedEvent.id })
    .from(feedEvent)
    .where(
      and(eq(feedEvent.userId, userId), eq(feedEvent.kind, "comeback"), gt(feedEvent.createdAt, new Date(now.getTime() - DAY_MS))),
    )
    .limit(1);
  if (!recent) await db.insert(feedEvent).values({ userId, kind: "comeback", createdAt: now });
}

/**
 * События друзей – новые сверху.
 * Совместную практику двух моих друзей показываем один раз, свою совместную – не показываем.
 */
export async function listFeed(viewerId: string, now = new Date()): Promise<FeedItem[]> {
  const friends = await listFriends(viewerId);
  if (friends.length === 0) return [];
  const names = new Map(friends.map((friend) => [friend.id, friend.name]));
  const mine = db
    .select({ jointId: jointPracticeMember.jointId })
    .from(jointPracticeMember)
    .where(eq(jointPracticeMember.userId, viewerId));
  const events = await db
    .select()
    .from(feedEvent)
    .where(
      and(
        inArray(feedEvent.userId, [...names.keys()]),
        or(isNull(feedEvent.jointId), notInArray(feedEvent.jointId, mine)),
      ),
    )
    .orderBy(desc(feedEvent.createdAt))
    .limit(FEED_LIMIT);
  if (events.length === 0) return [];

  const jointIds = [...new Set(events.flatMap((event) => (event.jointId ? [event.jointId] : [])))];
  const [members, reactions, stages] = await Promise.all([
    jointIds.length === 0
      ? []
      : db
          .select({ jointId: jointPracticeMember.jointId, id: user.id, name: user.name })
          .from(jointPracticeMember)
          .innerJoin(user, eq(user.id, jointPracticeMember.userId))
          .where(inArray(jointPracticeMember.jointId, jointIds)),
    db
      .select({ eventId: feedReaction.eventId })
      .from(feedReaction)
      .where(and(eq(feedReaction.userId, viewerId), inArray(feedReaction.eventId, events.map((event) => event.id)))),
    getCompanionStages([...names.keys()], now),
  ]);
  const supported = new Set(reactions.map((row) => row.eventId));

  const seenJoints = new Set<string>();
  return events.flatMap((event): FeedItem[] => {
    if (event.jointId) {
      if (seenJoints.has(event.jointId)) return [];
      seenJoints.add(event.jointId);
    }
    const partner = event.jointId
      ? (members.find((member) => member.jointId === event.jointId && member.id !== event.userId) ?? null)
      : null;
    return [
      {
        id: event.id,
        kind: event.kind,
        createdAt: event.createdAt.toISOString(),
        author: { id: event.userId, name: names.get(event.userId) ?? "", companionStage: stages.get(event.userId) ?? 1 },
        partner: partner && { id: partner.id, name: partner.name },
        supported: supported.has(event.id),
      },
    ];
  });
}

/** «Поддержать» событие друга или снять поддержку. Чужое событие, которое мне не видно, – не найдено. */
export async function supportEvent(viewerId: string, eventId: unknown, on: boolean) {
  const notFound = new AppError("not_found", "Событие не найдено");
  if (typeof eventId !== "string" || !/^[0-9a-f-]{36}$/i.test(eventId)) throw notFound;
  const [event] = await db
    .select({ id: feedEvent.id, userId: feedEvent.userId })
    .from(feedEvent)
    .where(eq(feedEvent.id, eventId));
  if (!event) throw notFound;
  if ((await getPublicProfile(viewerId, event.userId))?.friendship !== "friend") throw notFound;
  if (on) {
    await db.insert(feedReaction).values({ eventId: event.id, userId: viewerId }).onConflictDoNothing();
  } else {
    await db.delete(feedReaction).where(and(eq(feedReaction.eventId, event.id), eq(feedReaction.userId, viewerId)));
  }
  return { supported: on };
}

export type SuggestedPerson = { id: string; name: string; companionStage: number; friendship: FriendshipStatus };

/** Когда друзей нет: несколько случайных людей из приложения, чтобы добавить в друзья. */
export async function suggestPeople(viewerId: string, now = new Date()): Promise<SuggestedPerson[]> {
  const people = await db
    .select({ id: user.id, name: user.name })
    .from(user)
    .where(and(ne(user.id, viewerId), eq(user.role, "user"), ne(user.name, "")))
    .orderBy(sql`random()`)
    .limit(PEOPLE_LIMIT);
  const [stages, profiles] = await Promise.all([
    getCompanionStages(people.map((person) => person.id), now),
    Promise.all(people.map((person) => getPublicProfile(viewerId, person.id))),
  ]);
  return people.map((person, index) => ({
    ...person,
    companionStage: stages.get(person.id) ?? 1,
    friendship: profiles[index]?.friendship ?? "none",
  }));
}
