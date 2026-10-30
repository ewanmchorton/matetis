import { verifyPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";

import { account, db, user } from "@/shared/db";

import { clearDatabase, createPerson } from "../../../../tests/people";
import { canSignInWithPassword, listStaffForAdmin, resetStaffPassword, setStaffRole } from "./staff.server";

let admin: string;
let maria: string;

async function storedPassword(userId: string) {
  const [row] = await db
    .select({ password: account.password })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "credential")));
  return row?.password ?? null;
}

async function roleOf(userId: string) {
  const [row] = await db.select({ role: user.role }).from(user).where(eq(user.id, userId));
  return row.role;
}

beforeEach(async () => {
  await clearDatabase();
  admin = await createPerson("Татьяна Валерьевна", "admin", "admin@example.ru");
  maria = await createPerson("Мария", "user", "maria@example.ru");
});

describe("Назначение сотрудников", () => {
  it("админ делает зарегистрированного человека контент-менеджером и задаёт пароль", async () => {
    await setStaffRole(admin, { email: " Maria@Example.ru ", role: "content_manager", password: "секретный1" });
    expect(await roleOf(maria)).toBe("content_manager");
    expect(await verifyPassword({ hash: (await storedPassword(maria))!, password: "секретный1" })).toBe(true);
    const staff = await listStaffForAdmin(admin);
    expect(staff.find((member) => member.email === "maria@example.ru")).toMatchObject({
      role: "content_manager",
      hasPassword: true,
    });
  });

  it("любого зарегистрированного можно сделать администратором", async () => {
    await setStaffRole(admin, { email: "maria@example.ru", role: "admin", password: "секретный1" });
    expect(await roleOf(maria)).toBe("admin");
  });

  it("новому сотруднику без пароля роль не назначается", async () => {
    await expect(setStaffRole(admin, { email: "maria@example.ru", role: "content_manager" })).rejects.toThrow(
      "Задайте пароль",
    );
    expect(await roleOf(maria)).toBe("user");
  });

  it("пароль короче 8 знаков не принимается", async () => {
    await expect(
      setStaffRole(admin, { email: "maria@example.ru", role: "content_manager", password: "1234567" }),
    ).rejects.toThrow("не короче 8 знаков");
  });

  it("незарегистрированную почту назначить нельзя", async () => {
    await expect(
      setStaffRole(admin, { email: "nobody@example.ru", role: "content_manager", password: "секретный1" }),
    ).rejects.toThrow("не зарегистрирован");
  });

  it("вернуть в ученики — пароль удаляется", async () => {
    await setStaffRole(admin, { email: "maria@example.ru", role: "content_manager", password: "секретный1" });
    await setStaffRole(admin, { email: "maria@example.ru", role: "user" });
    expect(await roleOf(maria)).toBe("user");
    expect(await storedPassword(maria)).toBeNull();
  });

  it("свою роль администратора снять нельзя", async () => {
    await expect(setStaffRole(admin, { email: "admin@example.ru", role: "user" })).rejects.toThrow(
      "Свою роль администратора",
    );
  });

  it("контент-менеджер роли не назначает", async () => {
    await setStaffRole(admin, { email: "maria@example.ru", role: "content_manager", password: "секретный1" });
    const oleg = await createPerson("Олег", "user", "oleg@example.ru");
    await expect(
      setStaffRole(maria, { email: "oleg@example.ru", role: "admin", password: "секретный1" }),
    ).rejects.toThrow("только администратору");
    expect(await roleOf(oleg)).toBe("user");
  });

  it("админ задаёт сотруднику новый пароль, старый перестаёт подходить", async () => {
    await setStaffRole(admin, { email: "maria@example.ru", role: "content_manager", password: "секретный1" });
    await resetStaffPassword(admin, { email: "maria@example.ru", password: "новыйпароль" });
    const hash = (await storedPassword(maria))!;
    expect(await verifyPassword({ hash, password: "новыйпароль" })).toBe(true);
    expect(await verifyPassword({ hash, password: "секретный1" })).toBe(false);
  });
});

describe("Вход по паролю", () => {
  it("только сотрудникам: ученику вход по паролю закрыт", async () => {
    expect(await canSignInWithPassword("admin@example.ru")).toBe(true);
    expect(await canSignInWithPassword("maria@example.ru")).toBe(false);
    await setStaffRole(admin, { email: "maria@example.ru", role: "content_manager", password: "секретный1" });
    expect(await canSignInWithPassword(" MARIA@example.ru")).toBe(true);
    expect(await canSignInWithPassword("nobody@example.ru")).toBe(false);
  });
});
