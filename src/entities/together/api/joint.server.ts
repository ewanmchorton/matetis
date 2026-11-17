// Совместные практики и предложение месяца. Только серверный код.
// Каждая функция получает id того, кто делает запрос; вход и доступ проверяет вызывающий код.
import { and, desc, eq, inArray, isNull, ne, notInArray, sql } from "drizzle-orm";

import { hasAccess } from "@/entities/access/server";
import { getPublicProfile, listFriends } from "@/entities/friendship/server";
import { getMySettings } from "@/entities/person-settings/server";
import { getCompanionStages, practicesVisibleTo, setPracticeDone, todayFor, type Practice } from "@/entities/program/server";
import { db, feedEvent, jointPractice, jointPracticeMember, monthlyMatch, practice, practiceMark, user } from "@/shared/db";
import { AppError } from "@/shared/lib/app-error";

import { answerDeadline, answerExpired, jointEndsOn, monthlyMatchDue, monthOf } from "../model/days";

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type Joint = typeof jointPractice.$inferSelect;

export type JointPartner = {
  id: string;
  name: string;
  companionStage: number;
  /** Пара из предложения месяца может быть не из друзей – тогда на карточке «Добавить в друзья». */
  isFriend: boolean;
};

type CardBase = { id: string; practice: { id: string; title: string }; partner: JointPartner };

/** Карточка сверху вкладки «Вместе». */
export type JointCard =
  | (CardBase & { kind: "incoming"; answerBy: string })
  | (CardBase & { kind: "outgoing"; answerBy: string })
  | (CardBase & { kind: "monthly"; iAccepted: boolean; answerBy: string })
  | (CardBase & { kind: "active"; startsOn: string; endsOn: string; myDone: boolean; partnerDone: boolean })
  | (CardBase & { kind: "completed" });

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const notFound = () => new AppError("not_found", "Совместная практика не найдена");

function isUniqueViolation(error: unknown): boolean {
  const code = (error as { code?: string; cause?: { code?: string } })?.code ?? (error as { cause?: { code?: string } })?.cause?.code;
  return code === "23505";
}

/** Можно ли пройти практику вместе: админ не запретил, и это не осознание. */
function jointCapable(item: Practice): boolean {
  return item.allowTogether && item.frequency !== "awareness";
}

/** Практики, которые сегодня есть в программе у обоих и которые можно проходить вместе. */
export async function commonPractices(a: string, b: string, now = new Date()): Promise<Practice[]> {
  const [mine, theirs] = await Promise.all([practicesVisibleTo(a, now), practicesVisibleTo(b, now)]);
  const theirIds = new Set(theirs.map((item) => item.id));
  return mine.filter((item) => jointCapable(item) && theirIds.has(item.id));
}

async function closeJoint(tx: Tx | typeof db, jointId: string, status: Joint["status"], now: Date) {
  await tx.update(jointPractice).set({ status, closedAt: now }).where(eq(jointPractice.id, jointId));
  await tx.update(jointPracticeMember).set({ open: false }).where(eq(jointPracticeMember.jointId, jointId));
}

/** Закрыть то, у чего вышел срок: ответа нет 3 суток или 7 дней практики прошли. */
async function closeStale(userIds: string[], now: Date) {
  if (userIds.length === 0) return;
  const open = await db
    .select({ joint: jointPractice, userId: jointPracticeMember.userId })
    .from(jointPracticeMember)
    .innerJoin(jointPractice, eq(jointPractice.id, jointPracticeMember.jointId))
    .where(and(inArray(jointPracticeMember.userId, userIds), eq(jointPracticeMember.open, true)));
  for (const { joint, userId } of open) {
    if (joint.status === "pending" && answerExpired(joint.createdAt, now)) {
      await closeJoint(db, joint.id, "expired", now);
    } else if (joint.status === "active" && joint.endsOn && joint.endsOn < (await todayFor(userId, now))) {
      await closeJoint(db, joint.id, "expired", now);
    }
  }
}

async function openJointOf(userId: string): Promise<Joint | null> {
  const [row] = await db
    .select({ joint: jointPractice })
    .from(jointPracticeMember)
    .innerJoin(jointPractice, eq(jointPractice.id, jointPracticeMember.jointId))
    .where(and(eq(jointPracticeMember.userId, userId), eq(jointPracticeMember.open, true)))
    .limit(1);
  return row?.joint ?? null;
}

async function membersOf(jointId: string) {
  return db.select().from(jointPracticeMember).where(eq(jointPracticeMember.jointId, jointId));
}

/** Совместная практика, в которой участвует человек, вместе с участниками. */
async function jointForMember(userId: string, jointId: unknown) {
  if (typeof jointId !== "string" || !UUID_PATTERN.test(jointId)) throw notFound();
  const [joint] = await db.select().from(jointPractice).where(eq(jointPractice.id, jointId));
  if (!joint) throw notFound();
  const members = await membersOf(joint.id);
  const me = members.find((member) => member.userId === userId);
  const partner = members.find((member) => member.userId !== userId);
  if (!me || !partner) throw notFound();
  return { joint, me, partner };
}

/** Сделал ли человек практику в общий период. Отметка в программе и на карточке – одна и та же. */
async function doneInPeriod(userId: string, joint: Joint): Promise<boolean> {
  if (!joint.startsOn || !joint.endsOn) return false;
  const [row] = await db
    .select({ day: practiceMark.day })
    .from(practiceMark)
    .where(
      and(
        eq(practiceMark.userId, userId),
        eq(practiceMark.practiceId, joint.practiceId),
        sql`${practiceMark.day} between ${joint.startsOn} and ${joint.endsOn}`,
      ),
    )
    .limit(1);
  return Boolean(row);
}

/** Оба сделали практику в общий период – завершена, у обоих событие в ленте. */
async function completeIfDone(joint: Joint, now: Date) {
  if (joint.status !== "active") return;
  const members = await membersOf(joint.id);
  const done = await Promise.all(members.map((member) => doneInPeriod(member.userId, joint)));
  if (!done.every(Boolean)) return;
  await db.transaction(async (tx) => {
    await closeJoint(tx, joint.id, "completed", now);
    await tx
      .insert(feedEvent)
      .values(members.map((member) => ({ userId: member.userId, kind: "joint_completed" as const, jointId: joint.id })))
      .onConflictDoNothing();
  });
}

/** После отметки практики: если она совместная и оба её сделали – завершить. */
export async function completeJointIfDone(userId: string, now = new Date()) {
  const joint = await openJointOf(userId);
  if (joint) await completeIfDone(joint, now);
}

/** Пригласить друга пройти практику вместе. */
export async function inviteFriend(userId: string, friendId: unknown, practiceId: unknown, now = new Date()) {
  if (typeof friendId !== "string" || typeof practiceId !== "string") throw notFound();
  if (friendId === userId) throw new AppError("self_invite", "Нельзя пригласить самого себя");
  const profile = await getPublicProfile(userId, friendId);
  if (profile?.friendship !== "friend") throw new AppError("not_friends", "Пригласить можно только друга");

  await closeStale([userId, friendId], now);
  if (await openJointOf(userId)) throw new AppError("busy_me", "У вас уже есть совместная практика");
  if (await openJointOf(friendId)) throw new AppError("busy_friend", "Друг уже практикует вместе");
  const common = await commonPractices(userId, friendId, now);
  if (!common.some((item) => item.id === practiceId)) {
    throw new AppError("practice_unavailable", "Эту практику нельзя пройти вместе");
  }

  try {
    return await db.transaction(async (tx) => {
      const [joint] = await tx
        .insert(jointPractice)
        .values({ practiceId, source: "invite", invitedBy: userId, createdAt: now })
        .returning({ id: jointPractice.id });
      await tx.insert(jointPracticeMember).values([
        { jointId: joint.id, userId, acceptedAt: now },
        { jointId: joint.id, userId: friendId },
      ]);
      return { id: joint.id };
    });
  } catch (error) {
    if (isUniqueViolation(error)) throw new AppError("busy", "У кого-то из вас уже есть совместная практика");
    throw error;
  }
}

/** Принять или отклонить приглашение или предложение месяца. Когда согласились оба – 7 дней пошли. */
export async function answerJoint(userId: string, jointId: unknown, accept: boolean, now = new Date()) {
  await closeStale([userId], now);
  const { joint, me, partner } = await jointForMember(userId, jointId);
  if (joint.status !== "pending" || me.acceptedAt) throw notFound();

  if (!accept) {
    await closeJoint(db, joint.id, "declined", now);
    return { ok: true };
  }
  if (!partner.acceptedAt) {
    await db
      .update(jointPracticeMember)
      .set({ acceptedAt: now })
      .where(and(eq(jointPracticeMember.jointId, joint.id), eq(jointPracticeMember.userId, userId)));
    return { ok: true };
  }
  const startsOn = await todayFor(userId, now);
  const [started] = await db.transaction(async (tx) => {
    await tx
      .update(jointPracticeMember)
      .set({ acceptedAt: now })
      .where(and(eq(jointPracticeMember.jointId, joint.id), eq(jointPracticeMember.userId, userId)));
    return tx
      .update(jointPractice)
      .set({ status: "active", startsOn, endsOn: jointEndsOn(startsOn) })
      .where(eq(jointPractice.id, joint.id))
      .returning();
  });
  // Практику могли сделать в программе ещё до согласия – в этот же день она засчитывается.
  await completeIfDone(started, now);
  return { ok: true };
}

/** Отменить своё приглашение, пока друг не ответил. */
export async function cancelInvite(userId: string, jointId: unknown, now = new Date()) {
  const { joint } = await jointForMember(userId, jointId);
  if (joint.status !== "pending" || joint.invitedBy !== userId) throw notFound();
  await closeJoint(db, joint.id, "cancelled", now);
  return { ok: true };
}

/** Прекратить совместную практику. Закрывается у обоих, личные отметки остаются. */
export async function stopJoint(userId: string, jointId: unknown, now = new Date()) {
  const { joint } = await jointForMember(userId, jointId);
  if (joint.status !== "active") throw notFound();
  await closeJoint(db, joint.id, "stopped", now);
  return { ok: true };
}

/** Закрыть карточку «Завершили». */
export async function dismissCompleted(userId: string, jointId: unknown, now = new Date()) {
  const { joint } = await jointForMember(userId, jointId);
  if (joint.status !== "completed") throw notFound();
  await db
    .update(jointPracticeMember)
    .set({ dismissedAt: now })
    .where(and(eq(jointPracticeMember.jointId, joint.id), eq(jointPracticeMember.userId, userId)));
  return { ok: true };
}

/** Отметка на карточке совместной практики – это отметка практики в личной программе. */
export async function markJoint(userId: string, jointId: unknown, done: boolean, now = new Date()) {
  const { joint } = await jointForMember(userId, jointId);
  if (joint.status !== "active") throw notFound();
  await setPracticeDone(userId, joint.practiceId, done, now);
  return { ok: true };
}

async function partnerOf(userId: string, partnerId: string, now: Date): Promise<JointPartner> {
  const [[row], profile, stages] = await Promise.all([
    db.select({ name: user.name }).from(user).where(eq(user.id, partnerId)),
    getPublicProfile(userId, partnerId),
    getCompanionStages([partnerId], now),
  ]);
  return {
    id: partnerId,
    name: row?.name ?? "",
    companionStage: stages.get(partnerId) ?? 1,
    isFriend: profile?.friendship === "friend",
  };
}

async function cardFor(userId: string, joint: Joint, now: Date): Promise<JointCard> {
  const { me, partner: partnerMember } = await jointForMember(userId, joint.id);
  const [[item], partner] = await Promise.all([
    db.select({ id: practice.id, title: practice.title }).from(practice).where(eq(practice.id, joint.practiceId)),
    partnerOf(userId, partnerMember.userId, now),
  ]);
  const base = { id: joint.id, practice: item, partner };
  const answerBy = answerDeadline(joint.createdAt).toISOString();
  if (joint.status === "completed") return { ...base, kind: "completed" };
  if (joint.status === "active") {
    const [myDone, partnerDone] = await Promise.all([
      doneInPeriod(userId, joint),
      doneInPeriod(partnerMember.userId, joint),
    ]);
    return { ...base, kind: "active", startsOn: joint.startsOn!, endsOn: joint.endsOn!, myDone, partnerDone };
  }
  if (joint.source === "monthly") return { ...base, kind: "monthly", iAccepted: Boolean(me.acceptedAt), answerBy };
  return { ...base, kind: joint.invitedBy === userId ? "outgoing" : "incoming", answerBy };
}

/** Кто ещё не закрыл карточку «Завершили». */
const unseenCompleted = and(eq(jointPractice.status, "completed"), isNull(jointPracticeMember.dismissedAt));

async function unseenCompletedOf(userId: string) {
  const [row] = await db
    .select({ joint: jointPractice })
    .from(jointPracticeMember)
    .innerJoin(jointPractice, eq(jointPractice.id, jointPracticeMember.jointId))
    .where(and(eq(jointPracticeMember.userId, userId), unseenCompleted))
    .orderBy(desc(jointPractice.closedAt))
    .limit(1);
  return row?.joint ?? null;
}

/**
 * Что показать сверху: открытая совместная практика или незакрытая карточка «Завершили».
 * Предложение месяца появляется только после того, как человек закрыл «Завершили».
 */
export async function getMyJointCard(userId: string, now = new Date()): Promise<JointCard | null> {
  await closeStale([userId], now);
  const open = await openJointOf(userId);
  if (open) return cardFor(userId, open, now);
  const completed = await unseenCompletedOf(userId);
  if (completed) return cardFor(userId, completed, now);
  await offerMonthlyMatch(userId, now);
  const offer = await openJointOf(userId);
  return offer ? cardFor(userId, offer, now) : null;
}

export type InviteOptions = {
  friends: { id: string; name: string; companionStage: number; busy: boolean }[];
  /** Практики, общие с выбранным другом. Друг не выбран – пусто. */
  practices: { id: string; title: string }[];
};

/** Что предложить в панели «Предложить практику»: друзья (занятые – отдельно) и общие практики. */
export async function getInviteOptions(userId: string, friendId: unknown, now = new Date()): Promise<InviteOptions> {
  const friends = await listFriends(userId);
  const ids = friends.map((friend) => friend.id);
  await closeStale(ids, now);
  const [busyRows, stages] = await Promise.all([
    ids.length === 0
      ? []
      : db
          .select({ userId: jointPracticeMember.userId })
          .from(jointPracticeMember)
          .where(and(inArray(jointPracticeMember.userId, ids), eq(jointPracticeMember.open, true))),
    getCompanionStages(ids, now),
  ]);
  const busy = new Set(busyRows.map((row) => row.userId));
  const practices =
    typeof friendId === "string" && ids.includes(friendId)
      ? (await commonPractices(userId, friendId, now)).map(({ id, title }) => ({ id, title }))
      : [];
  return {
    friends: friends.map((friend) => ({
      id: friend.id,
      name: friend.name,
      companionStage: stages.get(friend.id) ?? 1,
      busy: busy.has(friend.id),
    })),
    practices,
  };
}

function shuffle<T>(items: T[]): T[] {
  return items
    .map((item) => ({ item, key: Math.random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

/** Сколько людей проверяем при подборе пары, чтобы вход на вкладку не затягивался. */
const MATCH_CANDIDATES = 30;

/**
 * Предложение месяца. С 4-го числа при входе на вкладку: если у человека включено согласие,
 * нет открытой совместной практики и в этом месяце предложения ещё не было.
 * Пару ищем сначала среди друзей, потом среди всех с доступом и тем же согласием. Практика – общая.
 * Подходящей пары нет – предложения нет, попробуем при следующем входе.
 */
export async function offerMonthlyMatch(userId: string, now = new Date()) {
  const [me] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
  if (me?.role !== "user") return;
  const today = await todayFor(userId, now);
  if (!monthlyMatchDue(today)) return;
  const month = monthOf(today);
  if (!(await getMySettings(userId)).autoMatchConsent) return;
  if ((await openJointOf(userId)) || (await unseenCompletedOf(userId))) return;
  const [already] = await db
    .select({ userId: monthlyMatch.userId })
    .from(monthlyMatch)
    .where(and(eq(monthlyMatch.userId, userId), eq(monthlyMatch.month, month)));
  if (already) return;

  const mine = (await practicesVisibleTo(userId, now)).filter(jointCapable);
  if (mine.length === 0) return;

  const taken = db
    .select({ userId: jointPracticeMember.userId })
    .from(jointPracticeMember)
    .where(eq(jointPracticeMember.open, true));
  const finishing = db
    .select({ userId: jointPracticeMember.userId })
    .from(jointPracticeMember)
    .innerJoin(jointPractice, eq(jointPractice.id, jointPracticeMember.jointId))
    .where(unseenCompleted);
  const offered = db.select({ userId: monthlyMatch.userId }).from(monthlyMatch).where(eq(monthlyMatch.month, month));
  const candidates = await db
    .select({
      id: user.id,
      email: user.email,
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      role: user.role,
    })
    .from(user)
    .where(
      and(
        ne(user.id, userId),
        eq(user.role, "user"),
        notInArray(user.id, taken),
        notInArray(user.id, finishing),
        notInArray(user.id, offered),
        sql`coalesce((select ps.auto_match_consent from person_settings ps where ps.user_id = "user"."id"), true)`,
      ),
    );
  const friendIds = new Set((await listFriends(userId)).map((friend) => friend.id));
  const ordered = [
    ...shuffle(candidates.filter((candidate) => friendIds.has(candidate.id))),
    ...shuffle(candidates.filter((candidate) => !friendIds.has(candidate.id))),
  ].slice(0, MATCH_CANDIDATES);

  const mineIds = new Set(mine.map((item) => item.id));
  for (const candidate of ordered) {
    if (!(await hasAccess(candidate, now))) continue;
    const common = (await practicesVisibleTo(candidate.id, now)).filter((item) => mineIds.has(item.id) && jointCapable(item));
    if (common.length === 0) continue;
    const [chosen] = shuffle(common);
    try {
      await db.transaction(async (tx) => {
        const [joint] = await tx
          .insert(jointPractice)
          .values({ practiceId: chosen.id, source: "monthly", createdAt: now })
          .returning({ id: jointPractice.id });
        await tx.insert(jointPracticeMember).values([
          { jointId: joint.id, userId },
          { jointId: joint.id, userId: candidate.id },
        ]);
        await tx.insert(monthlyMatch).values([
          { userId, month, jointId: joint.id },
          { userId: candidate.id, month, jointId: joint.id },
        ]);
      });
    } catch (error) {
      // Кто-то из пары в эту секунду получил другое предложение или приглашение – попробуем при следующем входе.
      if (isUniqueViolation(error)) return;
      throw error;
    }
    return;
  }
}