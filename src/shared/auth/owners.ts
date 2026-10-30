// Владельцы приложения: их почта и ник в Telegram записаны в переменной OWNER_ADMINS
// (через запятую: "owner@example.ru, @owner_tg"). При каждом входе такой человек становится администратором,
// поэтому после новой базы или нового сервера ничего не нужно назначать вручную.
// В коде контактов нет: репозиторий открыт всем.
import { contactOf, normalizeContact, type ContactPerson } from "./contact";

/** Контакты владельцев из строки вида "a@b.ru, @nick". Неверные записи пропускаются. */
export function parseOwnerContacts(raw: string | undefined): Set<string> {
  const contacts = new Set<string>();
  for (const item of (raw ?? "").split(",")) {
    try {
      if (item.trim()) contacts.add(normalizeContact(item));
    } catch {
      // Опечатка в переменной не должна ломать вход остальных.
    }
  }
  return contacts;
}

/** Совпадает ли почта или ник человека с владельцем. */
export function isOwner(person: ContactPerson, owners = parseOwnerContacts(process.env.OWNER_ADMINS)): boolean {
  const email = person.email ? contactOf({ email: person.email }) : null;
  const username = person.telegramUsername ? contactOf({ telegramUsername: person.telegramUsername }) : null;
  return Boolean((email && owners.has(email)) || (username && owners.has(username)));
}
