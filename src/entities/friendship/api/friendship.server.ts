// Поиск людей, публичный профиль и дружба. Только серверный код.
// Каждая функция получает id того, кто делает запрос (viewerId).
// Проверку входа делает вызывающий код: серверное действие или обработчик запроса.
import { and, asc, eq, ilike, ne, or } from "drizzle-orm";

import { db, friendRequest, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

/** Всё, что о человеке может узнать другой человек. Больше полей сюда не добавлять. */
export type PublicPerson = {
  id: string;
  name: string;
  /** Адрес картинки или null — тогда экран показывает первую букву имени. */
  avatar: string | null;
};

/** Отношение к человеку с точки зрения того, кто смотрит. */
export type FriendshipStatus =
  | "none"
  | "friend"
  /** Он прислал мне запрос, я ещё не ответил. */
  | "incoming"
  /** Я отправил запрос, он ещё не ответил. */
  | "outgoing";

export type PublicProfile = {
  person: PublicPerson;
  friendship: FriendshipStatus;
};

// Поля выбираются поимённо: новые личные поля в таблице user сюда не попадут.
const publicPersonColumns = { id: user.id, name: user.name, avatar: user.image };

const SEARCH_LIMIT = 20;

function pairCondition(a: string, b: string) {
  return or(
    and(eq(friendRequest.fromUserId, a), eq(friendRequest.toUserId, b)),
    and(eq(friendRequest.fromUserId, b), eq(friendRequest.toUserId, a)),
  );
}

async function findPairRequest(a: string, b: string) {
  const [row] = await db.select().from(friendRequest).where(pairCondition(a, b)).limit(1);
  return row ?? null;
}

async function personExists(id: string) {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.id, id)).limit(1);
  return Boolean(row);
}

function escapeLike(text: string) {
  return text.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/** Найти людей по части имени. Себя в результатах нет. */
export async function searchPeople(viewerId: string, query: string): Promise<PublicPerson[]> {
  const text = query.trim();
  if (text === "") return [];
  return db
    .select(publicPersonColumns)
    .from(user)
    .where(and(ilike(user.name, `%${escapeLike(text)}%`), ne(user.id, viewerId)))
    .orderBy(asc(user.name))
    .limit(SEARCH_LIMIT);
}

/** Публичный профиль: имя, аватар и отношение к смотрящему. null — такого человека нет. */
export async function getPublicProfile(
  viewerId: string,
  personId: string,
): Promise<PublicProfile | null> {
  const [person] = await db
    .select(publicPersonColumns)
    .from(user)
    .where(eq(user.id, personId))
    .limit(1);
  if (!person) return null;

  // Отклонённый запрос никому не показывается: оба видят «нет связи».
  let friendship: FriendshipStatus = "none";
  if (personId !== viewerId) {
    const request = await findPairRequest(viewerId, personId);
    if (request?.status === "accepted") friendship = "friend";
    else if (request?.status === "pending") {
      friendship = request.fromUserId === viewerId ? "outgoing" : "incoming";
    }
  }
  return { person, friendship };
}

/**
 * Отправить запрос в друзья.
 * Если этот человек уже прислал запрос мне — запрос сразу принимается.
 * После отклонения запрос можно отправить снова.
 */
export async function sendFriendRequest(viewerId: string, personId: string): Promise<FriendshipStatus> {
  if (viewerId === personId) {
    throw new AppError("self_request", "Нельзя отправить запрос в друзья самому себе");
  }
  if (!(await personExists(personId))) {
    throw new AppError("person_not_found", "Человек не найден");
  }

  const existing = await findPairRequest(viewerId, personId);
  if (!existing) {
    await db.insert(friendRequest).values({ fromUserId: viewerId, toUserId: personId });
    return "outgoing";
  }
  if (existing.status === "accepted") {
    throw new AppError("already_friends", "Вы уже друзья");
  }
  if (existing.status === "pending" && existing.fromUserId === viewerId) {
    throw new AppError("already_sent", "Запрос уже отправлен");
  }
  if (existing.status === "pending") {
    await db
      .update(friendRequest)
      .set({ status: "accepted", respondedAt: new Date() })
      .where(eq(friendRequest.id, existing.id));
    return "friend";
  }
  // Запрос был отклонён: отправляем заново от имени того, кто отправляет сейчас.
  await db
    .update(friendRequest)
    .set({
      fromUserId: viewerId,
      toUserId: personId,
      status: "pending",
      createdAt: new Date(),
      respondedAt: null,
    })
    .where(eq(friendRequest.id, existing.id));
  return "outgoing";
}

async function answerFriendRequest(
  viewerId: string,
  personId: string,
  status: "accepted" | "declined",
) {
  // Ответить может только получатель запроса.
  const updated = await db
    .update(friendRequest)
    .set({ status, respondedAt: new Date() })
    .where(
      and(
        eq(friendRequest.fromUserId, personId),
        eq(friendRequest.toUserId, viewerId),
        eq(friendRequest.status, "pending"),
      ),
    )
    .returning({ id: friendRequest.id });
  if (updated.length === 0) {
    throw new AppError("request_not_found", "Запрос в друзья не найден");
  }
}

/** Принять запрос, который прислал personId. */
export function acceptFriendRequest(viewerId: string, personId: string) {
  return answerFriendRequest(viewerId, personId, "accepted");
}

/** Отклонить запрос, который прислал personId. */
export function declineFriendRequest(viewerId: string, personId: string) {
  return answerFriendRequest(viewerId, personId, "declined");
}

/** Удалить из друзей. Дружба пропадает у обоих. */
export async function removeFriend(viewerId: string, personId: string) {
  const deleted = await db
    .delete(friendRequest)
    .where(and(pairCondition(viewerId, personId), eq(friendRequest.status, "accepted")))
    .returning({ id: friendRequest.id });
  if (deleted.length === 0) {
    throw new AppError("not_friends", "Этого человека нет среди друзей");
  }
}

/** Мои друзья. */
export async function listFriends(viewerId: string): Promise<PublicPerson[]> {
  return db
    .select(publicPersonColumns)
    .from(friendRequest)
    .innerJoin(
      user,
      or(
        and(eq(friendRequest.fromUserId, viewerId), eq(user.id, friendRequest.toUserId)),
        and(eq(friendRequest.toUserId, viewerId), eq(user.id, friendRequest.fromUserId)),
      ),
    )
    .where(eq(friendRequest.status, "accepted"))
    .orderBy(asc(user.name));
}

/** Запросы, которые прислали мне и на которые я ещё не ответил. */
export async function listIncomingRequests(viewerId: string): Promise<PublicPerson[]> {
  return db
    .select(publicPersonColumns)
    .from(friendRequest)
    .innerJoin(user, eq(user.id, friendRequest.fromUserId))
    .where(and(eq(friendRequest.toUserId, viewerId), eq(friendRequest.status, "pending")))
    .orderBy(asc(friendRequest.createdAt));
}
