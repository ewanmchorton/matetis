// Вход через бота в Telegram. Только серверный код.
//
// 1. Приложение просит ссылку: сервер создаёт запрос входа и запоминает его в cookie этого браузера.
// 2. Человек открывает ссылку t.me/<бот>?start=<токен> и нажимает «Начать».
// 3. Бот получает /start <токен> и отмечает запрос подтверждённым: записывает номер и ник человека в Telegram.
// 4. Приложение раз в пару секунд спрашивает сервер; когда запрос подтверждён — человек входит.
//
// Запросы хранятся в таблице verification Better Auth. В базе — не сам токен, а его хэш.
import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";

import { accessExpiryReminder, accessPeriod, db, user, verification } from "@/shared/db";

import { contactOf, normalizeTelegramUsername } from "./contact";

/** Сколько минут действует ссылка для входа. */
export const TELEGRAM_LOGIN_MINUTES = 10;
const PENDING = "pending";

export type TelegramPerson = { telegramId: string; telegramUsername: string | null };

function identifierOf(token: string) {
  return `telegram-login:${createHash("sha256").update(token).digest("hex")}`;
}

/** Новый запрос входа. Возвращает токен для ссылки на бота: латиница, цифры, - и _, до 64 символов. */
export async function createLoginRequest(now = new Date()): Promise<string> {
  const token = randomBytes(24).toString("base64url");
  await db.insert(verification).values({
    id: randomBytes(16).toString("hex"),
    identifier: identifierOf(token),
    value: PENDING,
    expiresAt: new Date(now.getTime() + TELEGRAM_LOGIN_MINUTES * 60 * 1000),
  });
  return token;
}

/** Бот получил /start с токеном. false — ссылка устарела или уже использована. */
export async function confirmLoginRequest(token: string, person: TelegramPerson, now = new Date()) {
  const updated = await db
    .update(verification)
    .set({ value: JSON.stringify(person) })
    .where(
      and(
        eq(verification.identifier, identifierOf(token)),
        eq(verification.value, PENDING),
        gt(verification.expiresAt, now),
      ),
    )
    .returning({ id: verification.id });
  return updated.length > 0;
}

export type LoginRequestState = { status: "pending" } | { status: "expired" } | ({ status: "confirmed" } & TelegramPerson);

/** Состояние запроса для приложения. Подтверждённый запрос удаляется: войти по нему можно один раз. */
export async function takeLoginRequest(token: string, now = new Date()): Promise<LoginRequestState> {
  const identifier = identifierOf(token);
  const [row] = await db
    .select({ value: verification.value, expiresAt: verification.expiresAt })
    .from(verification)
    .where(eq(verification.identifier, identifier))
    .limit(1);
  if (!row || row.expiresAt <= now) return { status: "expired" };
  if (row.value === PENDING) return { status: "pending" };
  const deleted = await db.delete(verification).where(eq(verification.identifier, identifier)).returning({ id: verification.id });
  // Два одновременных запроса из приложения: войдёт только первый.
  if (deleted.length === 0) return { status: "expired" };
  return { status: "confirmed", ...(JSON.parse(row.value) as TelegramPerson) };
}

/**
 * Человек с этим номером в Telegram или null. Если он сменил ник — ник обновляется,
 * а доступ, открытый по старому нику, переезжает на новый.
 */
export async function findTelegramPerson(person: TelegramPerson): Promise<string | null> {
  const [found] = await db
    .select({ id: user.id, email: user.email, telegramUsername: user.telegramUsername })
    .from(user)
    .where(eq(user.telegramId, person.telegramId))
    .limit(1);
  if (!found) return null;
  if (found.telegramUsername === person.telegramUsername) return found.id;

  const oldContact = contactOf({ ...found, telegramId: person.telegramId });
  const newContact = contactOf({ ...person, email: found.email });
  await db.transaction(async (tx) => {
    await tx.update(user).set({ telegramUsername: person.telegramUsername }).where(eq(user.id, found.id));
    if (oldContact && newContact && oldContact !== newContact) {
      await tx.update(accessPeriod).set({ contact: newContact }).where(eq(accessPeriod.contact, oldContact));
      await tx.update(accessExpiryReminder).set({ contact: newContact }).where(eq(accessExpiryReminder.contact, oldContact));
    }
  });
  return found.id;
}

type TelegramUpdate = {
  message?: { chat?: { id?: number; type?: string }; from?: { id?: number; username?: string; is_bot?: boolean }; text?: string };
};

export const botReplies = {
  confirmed: "Готово! Вернитесь в приложение МАТЭТИС — вход выполнится сам.",
  expired: "Ссылка для входа устарела. Вернитесь в приложение и нажмите «Войти через Telegram» ещё раз.",
  hello: "Чтобы войти в МАТЭТИС, откройте приложение и нажмите «Войти через Telegram».",
};

/**
 * Обработка сообщения боту. Возвращает, кому и что ответить, или null, если отвечать не нужно.
 * Отвечаем только в личной переписке с человеком.
 */
export async function handleTelegramUpdate(update: TelegramUpdate, now = new Date()) {
  const message = update.message;
  const chatId = message?.chat?.id;
  const from = message?.from;
  if (!message || chatId === undefined || message.chat?.type !== "private" || !from?.id || from.is_bot) return null;

  const match = /^\/start(?:\s+([A-Za-z0-9_-]{1,64}))?$/.exec(message.text?.trim() ?? "");
  if (!match?.[1]) return { chatId, text: botReplies.hello };

  const confirmed = await confirmLoginRequest(
    match[1],
    { telegramId: String(from.id), telegramUsername: normalizeTelegramUsername(from.username) },
    now,
  );
  return { chatId, text: confirmed ? botReplies.confirmed : botReplies.expired };
}
