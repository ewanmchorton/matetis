import { beforeEach, describe, expect, it, vi } from "vitest";

import { extendAccess } from "@/entities/access/server";
import { updateMySettings } from "@/entities/person-settings/server";
import { saveMyTypeTest } from "@/entities/type-test-attempt/server";
import { savePushSubscription } from "@/shared/push/subscriptions.server";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { addPhrase, deletePhrase, listPhrasesForStaff, sendDailyPhrases } from "./daily-phrase.server";

// Настоящие уведомления не отправляем: запоминаем, что ушло бы и кому.
const sent = vi.hoisted(() => ({ messages: [] as { endpoint: string; body: string; url: string }[] }));
vi.mock("@/shared/push/send-push", () => ({
  sendPush: async (target: { endpoint: string }, message: { body: string; url: string }) => {
    sent.messages.push({ endpoint: target.endpoint, body: message.body, url: message.url });
    return "sent";
  },
}));

const PLATO_1 =
  "Быть обманутым самим собой — хуже всего, потому что в таком случае обманщик постоянно присутствует при обманываемом (Платон)";
const PLATO_2 = "Стараясь осчастливить других, мы находим своё собственное (Платон)";
const HEALER = "t1";
const IDEALIST = "t2";

/** 25 декабря 2026: 8:00 по Минску — промежуток 9–21 ещё не начался. */
const morning = new Date("2026-12-25T05:00:00Z");
/** Середина промежутка 9–21 по Минску (random = 0.5): 15:00 по Минску. */
const middle = new Date("2026-12-25T12:00:00Z");
const half = () => 0.5;
const first = () => 0;

let admin: string;
let manager: string;
let anna: string;

/** Человек с доступом, телефоном для уведомлений и типом «Целитель». */
async function createHealer(name: string) {
  const email = `${name.toLowerCase()}@example.ru`;
  const id = await createPerson(name, "user", email);
  await extendAccess(admin, email, { months: 1 }, new Date("2026-12-20T00:00:00Z"));
  await savePushSubscription(id, { endpoint: `https://push.example/${id}`, keys: { p256dh: "key", auth: "secret" } });
  await saveMyTypeTest(id, { group1: "В", group2: "1" });
  return id;
}

beforeEach(async () => {
  await clearDatabase();
  sent.messages = [];
  admin = await createPerson("Татьяна Валерьевна", "admin");
  manager = await createPerson("Мария", "content_manager");
  anna = await createHealer("Анна");
});

describe("Фразы дня в админке", () => {
  it("контент-менеджер добавляет фразу и отмечает, каким типам она подходит", async () => {
    await addPhrase(manager, { text: `  ${PLATO_1}  `, typeIds: [HEALER, "неизвестный"] });
    const [phrase] = await listPhrasesForStaff(admin);
    expect(phrase.text).toBe(PLATO_1);
    expect(phrase.typeIds).toEqual([HEALER]);
  });

  it("обычный человек не может ни увидеть, ни добавить фразы", async () => {
    await expect(addPhrase(anna, { text: PLATO_1 })).rejects.toThrow("Доступно только сотрудникам");
    await expect(listPhrasesForStaff(anna)).rejects.toThrow("Доступно только сотрудникам");
  });

  it("пустая или слишком длинная фраза не сохраняется", async () => {
    await expect(addPhrase(admin, { text: "   " })).rejects.toThrow("Напишите фразу");
    await expect(addPhrase(admin, { text: "а".repeat(301) })).rejects.toThrow("не поместится");
    expect(await listPhrasesForStaff(admin)).toEqual([]);
  });

  it("удалённая фраза больше не приходит", async () => {
    const phrase = await addPhrase(admin, { text: PLATO_1 });
    await deletePhrase(admin, phrase.id);
    expect(await sendDailyPhrases(middle, half)).toBe(0);
    expect(sent.messages).toEqual([]);
  });
});

describe("Отправка фразы дня", () => {
  beforeEach(async () => {
    await addPhrase(admin, { text: PLATO_1 });
  });

  it("приходит один раз в день, в случайный момент внутри промежутка 9–21 по Минску", async () => {
    expect(await sendDailyPhrases(morning, half)).toBe(0);
    expect(await sendDailyPhrases(new Date("2026-12-25T11:59:00Z"), half)).toBe(0);
    expect(await sendDailyPhrases(middle, half)).toBe(1);
    expect(sent.messages).toEqual([{ endpoint: `https://push.example/${anna}`, body: PLATO_1, url: "/program" }]);
    expect(await sendDailyPhrases(new Date("2026-12-25T15:00:00Z"), half)).toBe(0);
    expect(sent.messages).toHaveLength(1);
  });

  it("ночью и после конца промежутка не приходит", async () => {
    expect(await sendDailyPhrases(new Date("2026-12-25T20:00:00Z"), first)).toBe(0);
    expect(await sendDailyPhrases(new Date("2026-12-25T23:30:00Z"), first)).toBe(0);
    expect(sent.messages).toEqual([]);
  });

  it("приходит в промежутке, который человек выбрал сам", async () => {
    await updateMySettings(anna, { phraseFromHour: 18, phraseToHour: 20 });
    expect(await sendDailyPhrases(middle, first)).toBe(0);
    expect(await sendDailyPhrases(new Date("2026-12-25T15:00:00Z"), first)).toBe(1);
  });

  it("считает время по часам телефона человека", async () => {
    await updateMySettings(anna, { timeZone: "Asia/Vladivostok" });
    // 00:00 UTC — во Владивостоке 10 утра, в Минске 3 ночи.
    await createHealer("Борис");
    expect(await sendDailyPhrases(new Date("2026-12-25T00:00:00Z"), first)).toBe(1);
    expect(sent.messages.map((message) => message.endpoint)).toEqual([`https://push.example/${anna}`]);
  });

  it("без согласия в настройках не приходит", async () => {
    await updateMySettings(anna, { phraseNotifications: false });
    expect(await sendDailyPhrases(middle, first)).toBe(0);
    expect(sent.messages).toEqual([]);
  });

  it("без доступа к программе не приходит", async () => {
    const id = await createPerson("Олег", "user", "oleg@example.ru");
    await savePushSubscription(id, { endpoint: "https://push.example/oleg", keys: { p256dh: "key", auth: "secret" } });
    await sendDailyPhrases(middle, first);
    expect(sent.messages.map((message) => message.endpoint)).not.toContain("https://push.example/oleg");
  });

  it("фраза для другого типа не приходит, общая — приходит", async () => {
    await clearPhrases();
    await addPhrase(admin, { text: PLATO_2, typeIds: [IDEALIST] });
    expect(await sendDailyPhrases(middle, first)).toBe(0);
    await addPhrase(admin, { text: PLATO_1, typeIds: [HEALER, IDEALIST] });
    expect(await sendDailyPhrases(middle, first)).toBe(1);
    expect(sent.messages[0].body).toBe(PLATO_1);
  });

  it("фразы не повторяются, пока не придут все", async () => {
    await addPhrase(admin, { text: PLATO_2 });
    await sendDailyPhrases(middle, first);
    await sendDailyPhrases(new Date("2026-12-26T12:00:00Z"), first);
    expect(sent.messages.map((message) => message.body).sort()).toEqual([PLATO_1, PLATO_2].sort());
  });
});

async function clearPhrases() {
  for (const phrase of await listPhrasesForStaff(admin)) await deletePhrase(admin, phrase.id);
}
