import { describe, expect, it } from "vitest";

import { contactOf, isTelegramContact, normalizeContact, normalizeTelegramUsername } from "./contact";

describe("Контакт человека", () => {
  it("у вошедшего по почте — почта строчными", () => {
    expect(contactOf({ email: " Anna@Example.ru " })).toBe("anna@example.ru");
  });

  it("у вошедшего через Telegram — ник с @, без ника — номер", () => {
    expect(contactOf({ telegramId: "111", telegramUsername: "Oleg_Tg" })).toBe("@oleg_tg");
    expect(contactOf({ telegramId: "222", telegramUsername: null })).toBe("tg:222");
  });

  it("администратор вводит почту или ник с @ или без", () => {
    expect(normalizeContact(" Anna@Example.ru ")).toBe("anna@example.ru");
    expect(normalizeContact("@Oleg_Tg")).toBe("@oleg_tg");
    expect(normalizeContact("oleg_tg")).toBe("@oleg_tg");
    expect(normalizeContact("tg:222")).toBe("tg:222");
  });

  it("короткий ник, ник с пробелом или кириллицей не принимается", () => {
    for (const wrong of ["@abc", "oleg tg", "олег", "anna@", "@anna@mail.ru"]) {
      expect(() => normalizeContact(wrong)).toThrow("Введите почту или ник в Telegram");
    }
    expect(normalizeTelegramUsername("ab")).toBeNull();
  });

  it("контакт в Telegram отличается от почты", () => {
    expect(isTelegramContact("@oleg_tg")).toBe(true);
    expect(isTelegramContact("tg:222")).toBe(true);
    expect(isTelegramContact("anna@example.ru")).toBe(false);
  });
});
