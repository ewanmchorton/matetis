import { beforeEach, describe, expect, it } from "vitest";

import { extendAccess, hasAccess } from "@/entities/access/server";

import { clearDatabase, createPerson, createTelegramPerson } from "../../../tests/people";
import {
  botReplies,
  createLoginRequest,
  findTelegramPerson,
  handleTelegramUpdate,
  takeLoginRequest,
  TELEGRAM_LOGIN_MINUTES,
} from "./telegram-login";

const now = new Date("2026-10-29T12:00:00Z");
/** Метка браузера, в котором человек нажал «Войти через Telegram». */
const browser = "browser-1";
const minutesLater = (minutes: number) => new Date(now.getTime() + minutes * 60 * 1000);

/** Сообщение боту в личной переписке, как его присылает Telegram. */
function startMessage(text: string, from: { id: number; username?: string } = { id: 111, username: "Oleg_Tg" }) {
  return { message: { chat: { id: from.id, type: "private" }, from, text } };
}

beforeEach(clearDatabase);

describe("Вход через бота", () => {
  it("пока человек не нажал «Начать» — вход ждёт", async () => {
    const token = await createLoginRequest(browser, now);
    expect(await takeLoginRequest(token, browser, now)).toEqual({ status: "pending" });
  });

  it("«Начать» в боте подтверждает вход: приходит номер и ник строчными", async () => {
    const token = await createLoginRequest(browser, now);
    expect(await handleTelegramUpdate(startMessage(`/start ${token}`), now)).toEqual({
      chatId: 111,
      text: botReplies.confirmed,
    });
    expect(await takeLoginRequest(token, browser, now)).toEqual({
      status: "confirmed",
      telegramId: "111",
      telegramUsername: "oleg_tg",
    });
  });

  it("по подтверждённой ссылке войти можно только один раз", async () => {
    const token = await createLoginRequest(browser, now);
    await handleTelegramUpdate(startMessage(`/start ${token}`), now);
    await takeLoginRequest(token, browser, now);
    expect(await takeLoginRequest(token, browser, now)).toEqual({ status: "expired" });
  });

  it("ссылку нельзя подтвердить второй раз другим человеком", async () => {
    const token = await createLoginRequest(browser, now);
    await handleTelegramUpdate(startMessage(`/start ${token}`), now);
    const reply = await handleTelegramUpdate(startMessage(`/start ${token}`, { id: 999, username: "other_user" }), now);
    expect(reply?.text).toBe(botReplies.expired);
    expect(await takeLoginRequest(token, browser, now)).toMatchObject({ telegramId: "111" });
  });

  it("подтверждённый вход не достаётся другому браузеру", async () => {
    const token = await createLoginRequest(browser, now);
    expect(await takeLoginRequest(token, "browser-2", now)).toEqual({ status: "expired" });
    await handleTelegramUpdate(startMessage(`/start ${token}`), now);
    expect(await takeLoginRequest(token, "browser-2", now)).toEqual({ status: "expired" });
    expect(await takeLoginRequest(token, browser, now)).toMatchObject({ status: "confirmed", telegramId: "111" });
  });

  it("у браузера может быть несколько ссылок: входит по той, что нажали", async () => {
    const first = await createLoginRequest(browser, now);
    const second = await createLoginRequest(browser, now);
    await handleTelegramUpdate(startMessage(`/start ${first}`), now);
    expect(await takeLoginRequest(second, browser, now)).toEqual({ status: "pending" });
    expect(await takeLoginRequest(first, browser, now)).toMatchObject({ status: "confirmed" });
  });

  it(`через ${TELEGRAM_LOGIN_MINUTES} минут ссылка устаревает`, async () => {
    const token = await createLoginRequest(browser, now);
    const later = minutesLater(TELEGRAM_LOGIN_MINUTES);
    expect((await handleTelegramUpdate(startMessage(`/start ${token}`), later))?.text).toBe(botReplies.expired);
    expect(await takeLoginRequest(token, browser, later)).toEqual({ status: "expired" });
  });

  it("выдуманный токен не подтверждает ничего", async () => {
    expect((await handleTelegramUpdate(startMessage("/start abc123"), now))?.text).toBe(botReplies.expired);
  });

  it("/start без ссылки — подсказка, как войти; группы и боты не обрабатываются", async () => {
    expect((await handleTelegramUpdate(startMessage("/start"), now))?.text).toBe(botReplies.hello);
    expect((await handleTelegramUpdate(startMessage("привет"), now))?.text).toBe(botReplies.hello);
    const group = { message: { chat: { id: -5, type: "group" }, from: { id: 111 }, text: "/start" } };
    expect(await handleTelegramUpdate(group, now)).toBeNull();
    const bot = { message: { chat: { id: 7, type: "private" }, from: { id: 7, is_bot: true }, text: "/start" } };
    expect(await handleTelegramUpdate(bot, now)).toBeNull();
  });
});

describe("Человек из Telegram", () => {
  it("новый номер — человека ещё нет", async () => {
    expect(await findTelegramPerson({ telegramId: "111", telegramUsername: "oleg_tg" })).toBeNull();
  });

  it("сменил ник — ник обновляется, доступ переезжает на новый", async () => {
    const admin = await createPerson("Татьяна Валерьевна", "admin");
    const id = await createTelegramPerson("Олег", "111", "oleg_old");
    await extendAccess(admin, "@oleg_old", { months: 1 }, now);

    expect(await findTelegramPerson({ telegramId: "111", telegramUsername: "oleg_new" })).toBe(id);
    expect(await hasAccess({ id, telegramId: "111", telegramUsername: "oleg_new" }, minutesLater(60))).toBe(true);
  });

  it("убрал ник — доступ остаётся за номером", async () => {
    const admin = await createPerson("Татьяна Валерьевна", "admin");
    const id = await createTelegramPerson("Олег", "111", "oleg_tg");
    await extendAccess(admin, "@oleg_tg", { months: 1 }, now);

    await findTelegramPerson({ telegramId: "111", telegramUsername: null });
    expect(await hasAccess({ id, telegramId: "111", telegramUsername: null }, minutesLater(60))).toBe(true);
  });
});
