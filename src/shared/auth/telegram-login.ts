// Вход через бота в Telegram. Только серверный код.
//
// 1. Экран входа заранее просит ссылку: сервер создаёт запрос входа и привязывает его к метке браузера —
//    случайной строке, которую экран придумал сам и никому не показывает. Войти сможет только этот браузер.
// 2. Человек открывает ссылку t.me/<бот>?start=<токен> и нажимает «Начать».
// 3. Бот получает /start <токен> и отмечает запрос подтверждённым: записывает номер и ник человека в Telegram.
// 4. Приложение раз в пару секунд спрашивает сервер; когда запрос подтверждён — человек входит.
//
// Запросы хранятся в таблице verification Better Auth. В базе — не токен и не метка браузера, а их хэши.
import { createHash, randomBytes } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";

import { accessExpiryReminder, accessPeriod, db, user, verification } from "@/shared/db";

import { contactOf, normalizeTelegramUsername } from "./contact";

/** Сколько минут действует ссылка для входа. */
export const TELEGRAM_LOGIN_MINUTES = 10;
/**
 * Запрос ждёт «Начать» в боте: "pending:<хэш метки браузера>". Подтверждённый — JSON с номером и ником.
 * По нему уже вошли — "used:<номер в Telegram>": до конца срока бот на эту ссылку отвечает «Готово».
 */
const PENDING_PREFIX = "pending:";
const USED_PREFIX = "used:";

export type TelegramPerson = { telegramId: string; telegramUsername: string | null };
type ConfirmedValue = TelegramPerson & { browser: string };

const sha256 = (value: string) => createHash("sha256").update(value).digest("hex");
const identifierOf = (token: string) => `telegram-login:${sha256(token)}`;

/** Новый запрос входа для этого браузера. Возвращает токен для ссылки на бота. */
export async function createLoginRequest(browserId: string, now = new Date()): Promise<string> {
  // Латиница, цифры, - и _: Telegram принимает в ссылке только такие символы.
  const token = randomBytes(24).toString("base64url");
  await db.insert(verification).values({
    id: randomBytes(16).toString("hex"),
    identifier: identifierOf(token),
    value: PENDING_PREFIX + sha256(browserId),
    expiresAt: new Date(now.getTime() + TELEGRAM_LOGIN_MINUTES * 60 * 1000),
  });
  return token;
}

async function readRequest(token: string, now: Date) {
  const [row] = await db
    .select({ value: verification.value, expiresAt: verification.expiresAt })
    .from(verification)
    .where(eq(verification.identifier, identifierOf(token)))
    .limit(1);
  return row && row.expiresAt > now ? row.value : null;
}

/** Тот же человек уже подтвердил эту ссылку (или уже вошёл по ней) — например, нажал «Начать» ещё раз. */
function confirmedBy(value: string, telegramId: string) {
  if (value.startsWith(USED_PREFIX)) return value === USED_PREFIX + telegramId;
  return (JSON.parse(value) as ConfirmedValue).telegramId === telegramId;
}

/**
 * Бот получил /start с токеном. "confirmed" — вход подтверждён, "again" — этот человек уже подтвердил
 * ссылку раньше, "expired" — ссылка устарела, выдумана или подтверждена другим человеком.
 */
export async function confirmLoginRequest(
  token: string,
  person: TelegramPerson,
  now = new Date(),
): Promise<"confirmed" | "again" | "expired"> {
  const value = await readRequest(token, now);
  if (!value) return "expired";
  if (!value.startsWith(PENDING_PREFIX)) return confirmedBy(value, person.telegramId) ? "again" : "expired";
  const confirmed: ConfirmedValue = { browser: value.slice(PENDING_PREFIX.length), ...person };
  // Условие на прежнее значение: если ссылку одновременно подтверждают двое, засчитается один.
  const updated = await db
    .update(verification)
    .set({ value: JSON.stringify(confirmed) })
    .where(and(eq(verification.identifier, identifierOf(token)), eq(verification.value, value), gt(verification.expiresAt, now)))
    .returning({ id: verification.id });
  return updated.length > 0 ? "confirmed" : "expired";
}

export type LoginRequestState = { status: "pending" } | { status: "expired" } | ({ status: "confirmed" } & TelegramPerson);

/**
 * Состояние запроса для приложения. Чужой браузер не отличит запрос от устаревшего.
 * По подтверждённому запросу войти можно один раз: после входа он помечается использованным.
 */
export async function takeLoginRequest(token: string, browserId: string, now = new Date()): Promise<LoginRequestState> {
  const value = await readRequest(token, now);
  if (!value) return { status: "expired" };
  const browser = sha256(browserId);
  if (value.startsWith(PENDING_PREFIX)) {
    return value === PENDING_PREFIX + browser ? { status: "pending" } : { status: "expired" };
  }
  if (value.startsWith(USED_PREFIX)) return { status: "expired" };
  const confirmed = JSON.parse(value) as ConfirmedValue;
  if (confirmed.browser !== browser) return { status: "expired" };
  const used = await db
    .update(verification)
    .set({ value: USED_PREFIX + confirmed.telegramId })
    .where(and(eq(verification.identifier, identifierOf(token)), eq(verification.value, value)))
    .returning({ id: verification.id });
  // Два одновременных запроса из приложения: войдёт только первый.
  if (used.length === 0) return { status: "expired" };
  return { status: "confirmed", telegramId: confirmed.telegramId, telegramUsername: confirmed.telegramUsername };
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
  confirmed: "Готово! Вернитесь в приложение МАТЭТИС для продолжения.",
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
  return { chatId, text: confirmed === "expired" ? botReplies.expired : botReplies.confirmed };
}
