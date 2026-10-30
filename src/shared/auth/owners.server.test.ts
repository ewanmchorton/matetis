import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { db, user } from "@/shared/db";
import { clearDatabase, createPerson, createTelegramPerson } from "../../../tests/people";

import { auth } from "./server";

const roleOf = async (id: string) => (await db.select({ role: user.role }).from(user).where(eq(user.id, id)))[0]?.role;

describe("Владелец при входе становится администратором", () => {
  const saved = process.env.OWNER_ADMINS;
  beforeEach(async () => {
    await clearDatabase();
    process.env.OWNER_ADMINS = "owner@example.ru, @owner_tg";
  });
  afterEach(() => {
    process.env.OWNER_ADMINS = saved;
  });

  it("по почте и по нику в Telegram", async () => {
    const byEmail = await createPerson("Владелец", "user", "owner@example.ru");
    const byTelegram = await createTelegramPerson("Владелец", "777", "owner_tg");
    const context = await auth.$context;
    await context.internalAdapter.createSession(byEmail);
    await context.internalAdapter.createSession(byTelegram);
    expect(await roleOf(byEmail)).toBe("admin");
    expect(await roleOf(byTelegram)).toBe("admin");
  });

  it("остальные остаются со своей ролью", async () => {
    const anna = await createPerson("Анна", "user", "anna@example.ru");
    await (await auth.$context).internalAdapter.createSession(anna);
    expect(await roleOf(anna)).toBe("user");
  });
});
