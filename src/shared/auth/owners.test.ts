import { describe, expect, it } from "vitest";

import { isOwner, parseOwnerContacts } from "./owners";

describe("Владельцы приложения", () => {
  const owners = parseOwnerContacts(" Owner@Example.ru , @Owner_TG, не контакт ");

  it("почта и ник читаются строчными, неверные записи пропускаются", () => {
    expect([...owners]).toEqual(["owner@example.ru", "@owner_tg"]);
  });

  it("владелец узнаётся по почте или по нику в Telegram", () => {
    expect(isOwner({ email: "OWNER@example.ru" }, owners)).toBe(true);
    expect(isOwner({ telegramId: "1", telegramUsername: "owner_tg" }, owners)).toBe(true);
  });

  it("другой человек и пустая переменная — не владелец", () => {
    expect(isOwner({ email: "anna@example.ru", telegramUsername: "anna_k" }, owners)).toBe(false);
    expect(isOwner({ telegramId: "1" }, owners)).toBe(false);
    expect(isOwner({ email: "owner@example.ru" }, parseOwnerContacts(undefined))).toBe(false);
  });
});
