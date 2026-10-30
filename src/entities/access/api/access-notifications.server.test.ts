import { beforeEach, describe, expect, it, vi } from "vitest";

import { db, pushSubscription } from "@/shared/db";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { extendAccess } from "./access.server";
import { notifyNewRequest, peopleCount, saveMyPushSubscription, sendExpiringDigest } from "./access-notifications.server";

// Настоящие уведомления не отправляем: запоминаем, что ушло бы и на какое устройство.
const sent = vi.hoisted(() => ({ messages: [] as { endpoint: string; body: string; url: string }[], gone: new Set<string>() }));
vi.mock("@/shared/push/send-push", () => ({
  sendPush: async (target: { endpoint: string }, message: { body: string; url: string }) => {
    if (sent.gone.has(target.endpoint)) return "gone";
    sent.messages.push({ endpoint: target.endpoint, body: message.body, url: message.url });
    return "sent";
  },
}));

const DAY = 24 * 60 * 60 * 1000;
/** 23 октября 2026, 10:00 по Минску (07:00 UTC). */
const digestTime = new Date("2026-10-23T07:00:00Z");
const subscription = (endpoint: string) => ({ endpoint, keys: { p256dh: "key", auth: "secret" } });

let admin: string;

beforeEach(async () => {
  await clearDatabase();
  sent.messages = [];
  sent.gone.clear();
  admin = await createPerson("Татьяна Валерьевна", "admin");
  await saveMyPushSubscription(admin, subscription("https://push.example/admin-phone"));
});

describe("Уведомление о заявке", () => {
  it("человек без доступа прошёл тест — администратору сразу приходит «Новая заявка»", async () => {
    const id = await createPerson("Ольга", "user", "olga@example.ru");
    await notifyNewRequest({ id, email: "olga@example.ru", name: "Ольга", role: "user" });
    expect(sent.messages).toEqual([
      { endpoint: "https://push.example/admin-phone", body: "Новая заявка: Ольга", url: "/admin/matetis?filter=request" },
    ]);
  });

  it("у человека уже есть доступ — это не заявка, уведомления нет", async () => {
    await extendAccess(admin, "olga@example.ru", { months: 1 });
    const id = await createPerson("Ольга", "user", "olga@example.ru");
    await notifyNewRequest({ id, email: "olga@example.ru", name: "Ольга", role: "user" });
    expect(sent.messages).toEqual([]);
  });

  it("контент-менеджер уведомлений о доступах не получает и включить их не может", async () => {
    const manager = await createPerson("Контент", "content_manager");
    await expect(saveMyPushSubscription(manager, subscription("https://push.example/manager"))).rejects.toThrow(
      "Доступно только администратору",
    );
    // Даже если устройство контент-менеджера оказалось в базе, ему не отправляем.
    await db.insert(pushSubscription).values({ userId: manager, endpoint: "https://push.example/manager", p256dh: "k", auth: "a" });
    const id = await createPerson("Ольга", "user", "olga@example.ru");
    await notifyNewRequest({ id, email: "olga@example.ru", name: "Ольга", role: "user" });
    expect(sent.messages.map((message) => message.endpoint)).toEqual(["https://push.example/admin-phone"]);
  });

  it("устройство, которое отписалось, удаляется и больше не получает уведомлений", async () => {
    sent.gone.add("https://push.example/admin-phone");
    const id = await createPerson("Ольга", "user", "olga@example.ru");
    await notifyNewRequest({ id, email: "olga@example.ru", name: "Ольга", role: "user" });
    expect(await db.select().from(pushSubscription)).toEqual([]);
  });

  it("неверная подписка не сохраняется", async () => {
    await expect(saveMyPushSubscription(admin, { endpoint: "http://insecure", keys: {} })).rejects.toThrow(
      "Не удалось включить уведомления",
    );
  });
});

describe("Ежедневная сводка о доступах", () => {
  async function openAccess(email: string, from: Date) {
    await extendAccess(admin, email, { months: 1 }, from);
  }
  // Доступ с 25 сентября по 25 октября: 23 октября до конца меньше 3 дней.
  const startedSep25 = new Date("2026-09-25T07:00:00Z");

  it("в 10:00 по Минску приходит одна сводка по всем, у кого доступ скоро закончится", async () => {
    await openAccess("anna@example.ru", startedSep25);
    await openAccess("boris@example.ru", startedSep25);
    await openAccess("ira@example.ru", new Date("2026-10-20T07:00:00Z"));
    expect(await sendExpiringDigest(digestTime)).toBe(2);
    expect(sent.messages).toEqual([
      {
        endpoint: "https://push.example/admin-phone",
        body: "У 2 человек доступ закончится в ближайшие 3 дня",
        url: "/admin/matetis?filter=expiring",
      },
    ]);
  });

  it("до 10:00 по Минску сводка не уходит", async () => {
    await openAccess("anna@example.ru", startedSep25);
    expect(await sendExpiringDigest(new Date(digestTime.getTime() - 60_000))).toBe(0);
    expect(sent.messages).toEqual([]);
  });

  it("не больше одной сводки в день, даже если позже появился ещё кто-то", async () => {
    await openAccess("anna@example.ru", startedSep25);
    await sendExpiringDigest(digestTime);
    await openAccess("boris@example.ru", startedSep25);
    expect(await sendExpiringDigest(new Date(digestTime.getTime() + 5 * 60 * 60 * 1000))).toBe(0);
    expect(sent.messages).toHaveLength(1);
  });

  it("человек попадает в сводку один раз за срок, после продления — снова", async () => {
    await openAccess("anna@example.ru", startedSep25);
    await sendExpiringDigest(digestTime);
    expect(await sendExpiringDigest(new Date(digestTime.getTime() + DAY))).toBe(0);

    await extendAccess(admin, "anna@example.ru", { months: 1 }, digestTime);
    const beforeNewEnd = new Date("2026-11-23T07:00:00Z");
    expect(await sendExpiringDigest(beforeNewEnd)).toBe(1);
    expect(sent.messages).toHaveLength(2);
  });

  it("если ни у кого доступ скоро не заканчивается — уведомления нет", async () => {
    await openAccess("anna@example.ru", digestTime);
    expect(await sendExpiringDigest(digestTime)).toBe(0);
    expect(sent.messages).toEqual([]);
  });

  it("«у 1 человека», «у 3 человек», «у 11 человек», «у 21 человека»", () => {
    expect([1, 3, 11, 21].map(peopleCount)).toEqual(["1 человека", "3 человек", "11 человек", "21 человека"]);
  });
});
