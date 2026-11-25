import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { acceptFriendRequest, sendFriendRequest } from "@/entities/friendship/server";
import { updateMySettings } from "@/entities/person-settings/server";
import { savePractice, setPracticeDone } from "@/entities/program/server";
import { accessPeriod, db, feedEvent, jointPractice, jointPracticeMember, practiceMark, programStart, user } from "@/shared/db";

import { clearDatabase, createPerson } from "../../../../tests/people";
import {
  afterPracticeMarked,
  answerJoint,
  cancelInvite,
  dismissCompleted,
  getInviteOptions,
  getTogether,
  inviteFriend,
  markJointPractice,
  stopJoint,
  supportEvent,
} from "../server";

// Металл 2026: со 2 ноября. Все начали программу 1 ноября.
const day = (date: string, time = "12:00") => new Date(`${date}T${time}:00+03:00`);
const nov2 = day("2026-11-02");

let anna: string;
let boris: string;
let olga: string;
let smile: string;
let sounds: string;

async function person(name: string) {
  const id = await createPerson(name);
  const [{ email }] = await db.select({ email: user.email }).from(user).where(eq(user.id, id));
  await db.insert(accessPeriod).values({
    contact: email!,
    startsAt: day("2026-10-01"),
    endsAt: day("2027-01-01"),
    amountCents: 0,
  });
  await db.insert(programStart).values({ userId: id, startedOn: "2026-11-01" });
  return id;
}

async function befriend(a: string, b: string) {
  await sendFriendRequest(a, b);
  await acceptFriendRequest(b, a);
}

async function mark(userId: string, practiceId: string, now: Date) {
  await setPracticeDone(userId, practiceId, true, now);
  await afterPracticeMarked(userId, now);
}

async function statusOf(jointId: string) {
  const [row] = await db.select({ status: jointPractice.status }).from(jointPractice).where(eq(jointPractice.id, jointId));
  return row.status;
}

beforeEach(async () => {
  await clearDatabase();
  const manager = await createPerson("Мария", "content_manager");
  anna = await person("Анна");
  boris = await person("Борис");
  olga = await person("Ольга");
  smile = (await savePractice(manager, { title: "Улыбка", frequency: "daily", daypart: "morning", position: 1 })).id;
  sounds = (
    await savePractice(manager, {
      title: "Звуки",
      frequency: "daily",
      daypart: "evening",
      position: 1,
      allowTogether: false,
    })
  ).id;
  await savePractice(manager, { title: "Осознание", frequency: "awareness", position: 1 });
  await befriend(anna, boris);
  // Предложение месяца проверяется отдельно, в остальных тестах оно не появляется.
  for (const id of [anna, boris, olga]) await updateMySettings(id, { autoMatchConsent: false });
});

describe("Предложить практику", () => {
  it("предлагаются друзья и только общие практики, которые админ не запретил; осознание – нет", async () => {
    const options = await getInviteOptions(anna, boris, nov2);
    expect(options.friends).toEqual([{ id: boris, name: "Борис", companionStage: 1, busy: false }]);
    expect(options.practices).toEqual([{ id: smile, title: "Улыбка" }]);
  });

  it("пригласить можно только друга и только разрешённую практику", async () => {
    await expect(inviteFriend(anna, olga, smile, nov2)).rejects.toMatchObject({ code: "not_friends" });
    await expect(inviteFriend(anna, boris, sounds, nov2)).rejects.toMatchObject({ code: "practice_unavailable" });
  });

  it("приглашение: у Бориса «Вас пригласили», у Анны «Ждём ответа»", async () => {
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    expect((await getTogether(boris, nov2)).card).toMatchObject({
      kind: "incoming",
      id,
      practice: { id: smile, title: "Улыбка" },
      partner: { id: anna, name: "Анна", isFriend: true },
    });
    const forAnna = await getTogether(anna, nov2);
    expect(forAnna.card).toMatchObject({ kind: "outgoing", partner: { id: boris } });
    expect(forAnna.canInvite).toBe(false);
  });

  it("одна открытая совместная практика на человека", async () => {
    await befriend(anna, olga);
    await befriend(boris, olga);
    await inviteFriend(anna, boris, smile, nov2);
    await expect(inviteFriend(anna, olga, smile, nov2)).rejects.toMatchObject({ code: "busy_me" });
    await expect(inviteFriend(olga, boris, smile, nov2)).rejects.toMatchObject({ code: "busy_friend" });
    expect((await getInviteOptions(olga, null, nov2)).friends.map((friend) => friend.busy)).toEqual([true, true]);
  });

  it("база сама не даёт человеку вторую открытую совместную практику", async () => {
    await inviteFriend(anna, boris, smile, nov2);
    const [other] = await db.insert(jointPractice).values({ practiceId: smile, source: "monthly" }).returning();
    await expect(db.insert(jointPracticeMember).values({ jointId: other.id, userId: anna })).rejects.toThrow();
  });
});

describe("Ответ на приглашение", () => {
  it("принял – 7 дней с дня согласия, карточка у обоих", async () => {
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    await answerJoint(boris, id, true, day("2026-11-03"));
    const card = (await getTogether(anna, day("2026-11-03"))).card;
    expect(card).toMatchObject({ kind: "active", startsOn: "2026-11-03", endsOn: "2026-11-09", myDone: false, partnerDone: false });
  });

  it("отклонил – карточки нет ни у кого, можно пригласить снова", async () => {
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    await answerJoint(boris, id, false, nov2);
    expect(await statusOf(id)).toBe("declined");
    expect((await getTogether(anna, nov2)).card).toBeNull();
    await expect(inviteFriend(anna, boris, smile, nov2)).resolves.toHaveProperty("id");
  });

  it("отменить может только пригласивший", async () => {
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    await expect(cancelInvite(boris, id, nov2)).rejects.toMatchObject({ code: "not_found" });
    await cancelInvite(anna, id, nov2);
    expect(await statusOf(id)).toBe("cancelled");
  });

  it("без ответа 3 суток приглашение закрывается само", async () => {
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    expect((await getTogether(boris, day("2026-11-05", "11:59"))).card).toMatchObject({ kind: "incoming" });
    expect((await getTogether(boris, day("2026-11-05", "12:00"))).card).toBeNull();
    expect(await statusOf(id)).toBe("expired");
  });

  it("чужой человек ответить не может", async () => {
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    await expect(answerJoint(olga, id, true, nov2)).rejects.toMatchObject({ code: "not_found" });
    await expect(answerJoint(anna, id, true, nov2)).rejects.toMatchObject({ code: "not_found" });
  });
});

describe("Совместная практика идёт", () => {
  let jointId: string;

  beforeEach(async () => {
    ({ id: jointId } = await inviteFriend(anna, boris, smile, nov2));
    await answerJoint(boris, jointId, true, nov2);
  });

  it("отметка на карточке – это отметка в программе; когда сделали оба – завершена", async () => {
    await markJointPractice(anna, jointId, true, day("2026-11-03"));
    const [own] = await db.select().from(practiceMark).where(eq(practiceMark.userId, anna));
    expect(own).toMatchObject({ practiceId: smile, day: "2026-11-03" });
    expect((await getTogether(boris, day("2026-11-03"))).card).toMatchObject({ myDone: false, partnerDone: true });

    // Борис отметил практику в программе, не на карточке – засчитывается.
    await mark(boris, smile, day("2026-11-05"));
    expect(await statusOf(jointId)).toBe("completed");
    expect((await getTogether(anna, day("2026-11-05"))).card).toMatchObject({ kind: "completed", partner: { id: boris } });
    const events = await db.select({ userId: feedEvent.userId }).from(feedEvent).where(eq(feedEvent.kind, "joint_completed"));
    expect(events.map((event) => event.userId).sort()).toEqual([anna, boris].sort());
  });

  it("«Хорошо» убирает карточку «Завершили», и можно предложить новую практику", async () => {
    await mark(anna, smile, nov2);
    await mark(boris, smile, nov2);
    await dismissCompleted(anna, jointId, nov2);
    const together = await getTogether(anna, nov2);
    expect(together.card).toBeNull();
    expect(together.canInvite).toBe(true);
    expect((await getTogether(boris, nov2)).card).toMatchObject({ kind: "completed" });
  });

  it("отметка до общего периода не считается", async () => {
    await db.update(jointPractice).set({ startsOn: "2026-11-03", endsOn: "2026-11-09" }).where(eq(jointPractice.id, jointId));
    await mark(anna, smile, nov2);
    await mark(boris, smile, day("2026-11-03"));
    expect(await statusOf(jointId)).toBe("active");
  });

  it("прекратить – закрывается у обоих, личные отметки остаются", async () => {
    await markJointPractice(anna, jointId, true, nov2);
    await stopJoint(boris, jointId, nov2);
    expect(await statusOf(jointId)).toBe("stopped");
    expect((await getTogether(anna, nov2)).card).toBeNull();
    expect(await db.select().from(practiceMark).where(eq(practiceMark.userId, anna))).toHaveLength(1);
  });

  it("7 дней прошли, а сделал один – карточка пропадает, отметки остаются", async () => {
    await mark(anna, smile, nov2);
    expect((await getTogether(anna, day("2026-11-08"))).card).toMatchObject({ kind: "active" });
    expect((await getTogether(anna, day("2026-11-09"))).card).toBeNull();
    expect(await statusOf(jointId)).toBe("expired");
    expect(await db.select().from(practiceMark).where(eq(practiceMark.userId, anna))).toHaveLength(1);
  });
});

describe("Лента событий друзей", () => {
  it("первая практика видна друзьям, но не чужим", async () => {
    await mark(boris, smile, nov2);
    const feed = (await getTogether(anna, nov2)).feed;
    expect(feed).toMatchObject([{ kind: "first_practice", author: { id: boris, name: "Борис" }, supported: false }]);
    expect(await db.select().from(feedEvent).where(eq(feedEvent.userId, boris))).toHaveLength(1);
    expect((await getTogether(olga, nov2)).feed).toEqual([]);
  });

  it("первая практика – одна; возвращение – после перерыва больше 7 дней", async () => {
    await mark(boris, sounds, day("2026-11-02"));
    await mark(boris, smile, day("2026-11-03"));
    await mark(boris, smile, day("2026-11-11")); // 7 пустых дней – ещё не возвращение
    await mark(boris, smile, day("2026-11-20")); // 8 пустых дней
    const kinds = await db.select({ kind: feedEvent.kind }).from(feedEvent).where(eq(feedEvent.userId, boris));
    expect(kinds.map((row) => row.kind).sort()).toEqual(["comeback", "first_practice"]);
  });

  it("«Поддержать» – одна реакция; чужое событие поддержать нельзя", async () => {
    await mark(boris, smile, nov2);
    const [event] = (await getTogether(anna, nov2)).feed;
    await supportEvent(anna, event.id, true);
    await supportEvent(anna, event.id, true);
    expect((await getTogether(anna, nov2)).feed[0].supported).toBe(true);
    await supportEvent(anna, event.id, false);
    expect((await getTogether(anna, nov2)).feed[0].supported).toBe(false);
    await expect(supportEvent(olga, event.id, true)).rejects.toMatchObject({ code: "not_found" });
  });

  it("совместную практику двух друзей общий друг видит один раз", async () => {
    await befriend(olga, anna);
    await befriend(olga, boris);
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    await answerJoint(boris, id, true, nov2);
    await mark(anna, smile, nov2);
    await mark(boris, smile, nov2);
    const together = (await getTogether(olga, nov2)).feed.filter((item) => item.kind === "joint_completed");
    expect(together).toHaveLength(1);
    expect([together[0].author.id, together[0].partner?.id].sort()).toEqual([anna, boris].sort());
    // Сами участники свою совместную практику в ленте друзей не видят.
    expect((await getTogether(anna, nov2)).feed.filter((item) => item.kind === "joint_completed")).toEqual([]);
  });

  it("нет друзей – вкладка предлагает людей из приложения", async () => {
    const together = await getTogether(olga, nov2);
    expect(together.hasFriends).toBe(false);
    expect(together.people.map((item) => item.name).sort()).toEqual(["Анна", "Борис"]);
    expect(together.people[0]).toMatchObject({ friendship: "none", companionStage: 1 });
  });
});

describe("Предложение месяца", () => {
  beforeEach(async () => {
    for (const id of [anna, boris, olga]) await updateMySettings(id, { autoMatchConsent: true });
  });

  it("до 4-го числа не предлагается", async () => {
    expect((await getTogether(anna, day("2026-11-03"))).card).toBeNull();
  });

  it("с 4-го – пара с другом и общая практика, начинается после согласия обоих", async () => {
    const nov4 = day("2026-11-04");
    const card = (await getTogether(anna, nov4)).card;
    expect(card).toMatchObject({ kind: "monthly", practice: { id: smile }, partner: { id: boris, isFriend: true }, iAccepted: false });
    expect((await getTogether(boris, nov4)).card).toMatchObject({ kind: "monthly", partner: { id: anna } });

    await answerJoint(anna, card!.id, true, nov4);
    expect((await getTogether(anna, nov4)).card).toMatchObject({ kind: "monthly", iAccepted: true });
    await answerJoint(boris, card!.id, true, nov4);
    expect((await getTogether(anna, nov4)).card).toMatchObject({ kind: "active", startsOn: "2026-11-04" });
  });

  it("одно предложение на человека в месяц: после отказа новое не появляется", async () => {
    const nov4 = day("2026-11-04");
    const card = (await getTogether(anna, nov4)).card;
    await answerJoint(boris, card!.id, false, nov4);
    expect((await getTogether(anna, day("2026-11-10"))).card).toBeNull();
    expect((await getTogether(olga, day("2026-11-10"))).card).toBeNull();
  });

  it("без друзей – пара с любым человеком, друзьями они не становятся", async () => {
    const card = (await getTogether(olga, day("2026-11-04"))).card;
    expect(card).toMatchObject({ kind: "monthly", partner: { isFriend: false } });
  });

  it("без согласия на автоподбор – не предлагается ни ему, ни с ним", async () => {
    await updateMySettings(boris, { autoMatchConsent: false });
    await updateMySettings(olga, { autoMatchConsent: false });
    expect((await getTogether(anna, day("2026-11-04"))).card).toBeNull();
  });

  it("пока карточка «Завершили» не закрыта, предложение месяца не появляется", async () => {
    await updateMySettings(olga, { autoMatchConsent: false });
    const { id } = await inviteFriend(anna, boris, smile, nov2);
    await answerJoint(boris, id, true, nov2);
    await mark(anna, smile, nov2);
    await mark(boris, smile, nov2);
    expect((await getTogether(anna, day("2026-11-04"))).card).toMatchObject({ kind: "completed" });
    await dismissCompleted(anna, id, day("2026-11-04"));
    // У Бориса «Завершили» ещё висит – с ним пару не подбираем.
    expect((await getTogether(anna, day("2026-11-04"))).card).toBeNull();
    await dismissCompleted(boris, id, day("2026-11-04"));
    expect((await getTogether(boris, day("2026-11-04"))).card).toMatchObject({ kind: "monthly", partner: { id: anna } });
  });

  it("у кого уже есть приглашение – пары месяца нет", async () => {
    await inviteFriend(anna, boris, smile, nov2);
    expect((await getTogether(olga, day("2026-11-04"))).card).toBeNull();
    const open = await db
      .select()
      .from(jointPracticeMember)
      .where(and(eq(jointPracticeMember.userId, olga), eq(jointPracticeMember.open, true)));
    expect(open).toHaveLength(0);
  });
});
