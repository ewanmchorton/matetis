// Контакт человека — то, по чему администратор открывает доступ и узнаёт человека:
// почта (anna@example.ru), ник в Telegram (@anna_k) или, если ника нет, номер в Telegram (tg:123456).
// Всегда строчными буквами. Правила совпадают с проверкой access_period_contact_format в базе.
import { AppError } from "@/shared/lib/app-error";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TELEGRAM_USERNAME_PATTERN = /^[a-z0-9_]{5,32}$/;
const TELEGRAM_ID_CONTACT_PATTERN = /^tg:\d+$/;

export type ContactPerson = {
  email?: string | null;
  telegramId?: string | null;
  telegramUsername?: string | null;
};

/** Ник в Telegram строчными и без @ или null, если такого ника быть не может. */
export function normalizeTelegramUsername(raw: unknown): string | null {
  const username = typeof raw === "string" ? raw.trim().replace(/^@/, "").toLowerCase() : "";
  return TELEGRAM_USERNAME_PATTERN.test(username) ? username : null;
}

/** Контакт вошедшего человека: почта, иначе @ник, иначе номер в Telegram. */
export function contactOf(person: ContactPerson): string | null {
  if (person.email) return person.email.trim().toLowerCase();
  if (person.telegramUsername) return `@${person.telegramUsername.toLowerCase()}`;
  if (person.telegramId) return `tg:${person.telegramId}`;
  return null;
}

/** Контакт, который ввёл администратор: почта, ник с @ или без. Иначе — ошибка с понятным текстом. */
export function normalizeContact(raw: unknown): string {
  const value = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (TELEGRAM_ID_CONTACT_PATTERN.test(value)) return value;
  if (!value.startsWith("@") && EMAIL_PATTERN.test(value)) return value;
  const username = normalizeTelegramUsername(value);
  if (username) return `@${username}`;
  throw new AppError("invalid_contact", "Введите почту или ник в Telegram");
}

/** Контакт в Telegram, а не почта. */
export function isTelegramContact(contact: string): boolean {
  return contact.startsWith("@") || contact.startsWith("tg:");
}
